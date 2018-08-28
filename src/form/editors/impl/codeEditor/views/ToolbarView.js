import template from '../templates/toolbar.html';

export default Marionette.View.extend({
    className: 'dev-code-editor-toolbar',

    template: Handlebars.compile(template),

    ui: {
        compile: '.js-code-editor-compile',
        undo: '.js-code-editor-undo',
        redo: '.js-code-editor-redo',
        format: '.js-code-editor-format',
        hint: '.js-code-editor-hint',
        find: '.js-code-editor-find',
        maximize: '.js-code-editor-maximize',
        minimize: '.js-code-editor-minimize'
    },

    triggers: {
        'click @ui.compile': 'compile',
        'click @ui.undo': 'undo',
        'click @ui.redo': 'redo',
        'click @ui.format': 'format',
        'click @ui.hint': 'show:hint',
        'click @ui.find': 'find'
    },

    events: {
        'click @ui.maximize': '__onMaximize',
        'click @ui.minimize': '__onMinimize'
    },

    onRender() {
        if (this.options.editor.options.mode === 'expression') {
            this.ui.compile.style.display = 'none';
        }
    },

    onAttach() {
        this.ui.minimize.setAttribute('displayNone', true);
    },

    maximize() {
        this.ui.maximize.setAttribute('displayNone', true);
        this.ui.minimize.removeAttribute('displayNone');;
    },

    minimize() {
        this.ui.maximize.removeAttribute('displayNone');;
        this.ui.minimize.setAttribute('displayNone', true);
    },

    __onMaximize() {
        this.maximize();
        this.trigger('maximize');
    },

    __onMinimize() {
        this.minimize();
        this.trigger('minimize');
    }
});
