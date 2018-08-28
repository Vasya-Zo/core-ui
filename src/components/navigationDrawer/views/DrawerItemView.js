//@flow
import template from '../templates/groupItem.html';

const classes = {
    selected: 'selected'
};

export default Marionette.View.extend({
    template: Handlebars.compile(template),

    onRender() {
        this.el.classList.toggle(classes.selected, !!this.model.selected);
    },

    className: 'navigationDrawer__li'
});
