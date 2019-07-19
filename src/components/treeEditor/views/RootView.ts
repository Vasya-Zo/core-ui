import BranchView from './BranchView';
import template from '../templates/root.hbs';
import CollapsibleBehavior from '../behaviors/CollapsibleBehavior';
import { getIconAndPrefixerClasses, setModelHiddenAttribute } from '../meta';
import LocalizationService from '../../../services/LocalizationService';

export default BranchView.extend({
    initialize(options) {
        BranchView.prototype.initialize.call(this, options);
        this.listenTo(this.collection, 'change:isHidden', () => {
            if (this.collection.settingAllState) {
                return;
            }

            this.__toggleHideAll(this.__getHiddenPrevalence());
        });
    },

    template: Handlebars.compile(template),

    templateContext() {
        return {
            ...BranchView.prototype.templateContext.call(this),
            hasContainerChilds: this.__hasContainerChilds()
        };
    },

    behaviors() {
        return this.__hasContainerChilds()
            ? {
                  CollapsibleBehavior: {
                      behaviorClass: CollapsibleBehavior,
                      options: {
                          zdarova: 'zdarova'
                      }
                  }
              }
            : {};
    },

    id() {
        return _.uniqueId('treeEditor-root_');
    },

    attributes: {},

    className() {},

    ui: {
        eyeBtn: '.js-eye-btn'
    },

    events: {
        'click @ui.eyeBtn': '__onEyeBtnClick'
    },

    collapseChildren(options: { interval: number, collapsed: boolean }) {
        this.children.forEach(view => view.toggleCollapsedState && view.toggleCollapsedState(options));
    },

    onRender() {
        this.__toggleHideAll(this.__getHiddenPrevalence());
    },

    __getHiddenPrevalence() {
        const slicedRequiredModels = this.collection.filter(model => !model.get('required'));
        const isHiddenPrevalence = slicedRequiredModels.filter(model => model.get('isHidden')).length > slicedRequiredModels.length / 2;

        return (this.model.allChildsHidden = isHiddenPrevalence);
    },

    __onEyeBtnClick(event: MouseEvent) {
        event.stopPropagation();
        const allChildsHidden = !this.model.allChildsHidden;

        this.__settHiiddenToChildsModels(allChildsHidden);
        this.__toggleHideAll(allChildsHidden);
    },

    __toggleHideAll(allChildsHidden: boolean) {
        const uiEyeElement = this.ui.eyeBtn[0];

        if (uiEyeElement) {
            uiEyeElement.classList.remove(...getIconAndPrefixerClasses(this.__getIconClass(allChildsHidden)));
            uiEyeElement.classList.add(...getIconAndPrefixerClasses(this.__getIconClass(!allChildsHidden)));
        }

        this.el.querySelector('.js-root-header-name').innerText = allChildsHidden
            ? LocalizationService.get('CORE.TOOLBAR.BLINKCHECKBOX.SHOWALL')
            : LocalizationService.get('CORE.TOOLBAR.BLINKCHECKBOX.HIDEALL');
    },

    __settHiiddenToChildsModels(hidden) {
        this.model.allChildsHidden = hidden;
        this.collection.settingAllState = true;
        this.collection.forEach(model => setModelHiddenAttribute(model, hidden));
        delete this.collection.settingAllState;
    },

    __hasContainerChilds() {
        return !!this.options.model.get(this.options.model.childrenAttribute).find(model => model.isContainer);
    }
});
