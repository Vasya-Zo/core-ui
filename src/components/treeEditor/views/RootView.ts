import BranchView from './BranchView';
import template from '../templates/root.hbs';
import ExpandBehavior from '../behaviors/ExpandBehavior';

export default BranchView.extend({
    template: Handlebars.compile(template),

    templateContext() {
        return {
            text: typeof this.options.getNodeName === 'function' ? this.options.getNodeName(this.model) : this.model.get('name') || ''
        };
    },

    behaviors: {
        ExpandBehavior: {
            behaviorClass: ExpandBehavior
        }
    },

    id() {
        return _.uniqueId('treeEditor-root_');
    },

    attributes: {},

    className: {},

    __getIconClass() {},

    __initCollapsed() {
        if (this.model.collapsed == null) {
            this.model.collapsed = false;
        }
    }
});
