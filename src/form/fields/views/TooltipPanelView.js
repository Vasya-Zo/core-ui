//@flow
export default Marionette.View.extend({
    modelEvents: {
        change: 'onChangeText'
    },

    className: 'form-label__tooltip-panel',

    template: false,

    onRender() {
        this.el.innerHtml = this.model.get(this.options.textAttribute);
    },

    onChangeText() {
        this.el.textinnerHtml = this.model.get(this.options.textAttribute);
    }
});
