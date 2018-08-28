//@flow
import template from '../templates/searchBar.hbs';
import LocalizationService from '../services/LocalizationService';

const defaultOptions = () => ({
    placeholder: LocalizationService.get('CORE.VIEWS.SEARCHBAR.PLACEHOLDER'),
    delay: 300
});

export default Marionette.View.extend({
    initialize(options) {
        _.extend(this.options, defaultOptions(), options || {});
        this.model = new Backbone.Model({
            placeholder: this.options.placeholder
        });
        this.__triggerSearch = _.debounce(this.__triggerSearch, this.options.delay);
    },

    template: Handlebars.compile(template),

    className: 'search-view',

    ui: {
        input: '.js-search-input',
        clear: '.js-search-clear'
    },

    events: {
        'keyup @ui.input': '__search',
        'click @ui.clear': '__clear'
    },

    onRender() {
        this.__adjustClearButtonVisibility(!!this.ui.input.value);
    },

    focus() {
        if (this.isRendered()) {
            this.ui.input.focus();
        }
    },

    __search() {
        const value = this.ui.input.value;
        this.__triggerSearch(value);
        this.__adjustClearButtonVisibility(!!value);
    },

    __triggerSearch(value) {
        this.trigger('search', value);
    },

    __clear() {
        this.ui.input.value = '';
        this.__search();
        this.ui.input.focus();
    },

    __adjustClearButtonVisibility(isShown) {
        if (isShown) {
            this.ui.clear.removeAttribute('displayNone');
        } else {
            this.ui.clear.setAttribute('displayNone', true);
        }
    }
});
