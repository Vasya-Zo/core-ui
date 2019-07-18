import TEButtonView from './views/TEButtonView';
import NodeViewFactory from './services/NodeViewFactory';
import TreeDiffController from './controllers/treeDiffController';

const defaultOptions = {
    eyeIconClass: 'eye',
    closedEyeIconClass: 'eye-slash',
    configDiff: {},
    getNodeName: undefined,
    showToolbar: false
};

interface TConfigDiff {
    [key: string]: {
        index?: number,
        isHidden?: boolean
    };
}

type TTreeEditorOptions = {
    model: any,
    hidden?: boolean,
    eyeIconClass?: string,
    closedEyeIconClass?: string,
    configDiff?: TConfigDiff,
    unNamedType?: string,
    stopNestingType?: string,
    forceBranchType?: string,
    getNodeName?: (model: any) => string,
    showToolbar?: boolean
};

export default class TreeEditor {
    configDiff: TConfigDiff;
    model: any;
    constructor(options: TTreeEditorOptions) {
        _.defaults(options, defaultOptions);
        this.configDiff = options.configDiff;
        this.model = options.model;

        const reqres = Backbone.Radio.channel(_.uniqueId('treeEditor'));

        this.treeDiffController = new TreeDiffController({ configDiff: this.configDiff, graphModel: this.model, reqres });

        const popoutView = Core.dropdown.factory.createPopout({
            buttonView: TEButtonView,
            buttonViewOptions: {
                iconClass: options.eyeIconClass
            },

            panelView: NodeViewFactory.getRootView({
                model: this.model,
                unNamedType: options.unNamedType,
                stopNestingType: options.stopNestingType,
                forceBranchType: options.forceBranchType,
                showToolbar: options.showToolbar
            }),
            panelViewOptions: {
                ...options,
                reqres,
                maxWidth: 300
            }
        });

        reqres.reply('treeEditor:collapse', () => popoutView.adjustPosition(false));

        popoutView.once('attach', () => popoutView.adjustPosition(false)); // TODO it doesn't work like this

        popoutView.listenTo(popoutView, 'close', () => this.__onSave());

        if (options.showToolbar) {
            reqres.reply('command:execute', actionModel => this.__commandExecute(actionModel));
        }

        if (options.hidden) {
            popoutView.el.setAttribute('hidden', true);
        }

        return (this.view = popoutView);
    }

    getDiffConfig() {
        return this.treeDiffController.configDiff;
    }

    __onSave() {
        this.view.trigger('save', this.getDiffConfig());
    }

    __onReset() {
        this.treeDiffController.reset();
        this.view.trigger('reset');
    }

    __commandExecute(actionModel) {
        switch (actionModel.id) {
            case 'reset':
                this.__onReset();
                break;
            case 'apply':
                this.__onSave();
                break;
            default:
                break;
        }
    }
}
