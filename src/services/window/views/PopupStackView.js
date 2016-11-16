/**
 * Developer: Ksenia Kartvelishvili
 * Date: 9/9/2016
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Comindware
 *       The copyright notice above does not evidence any
 *       actual or intended publication of such source code.
 */

'use strict';

import { Handlebars } from '../../../libApi';
import template from '../templates/PopupStack.hbs';

let classes = {
    POPUP_REGION: 'js-popup-region-',
    POPUP_FADE: 'popup-fade'
};

const POPUP_ID_PREFIX = 'popup-region-';

export default Marionette.LayoutView.extend({
    initialize () {
        this.__stack = [];
        this.__forceFadeBackground = false;
    },

    template: Handlebars.compile(template),

    ui: {
        fadingPanel: '.js-fading-panel'
    },

    showPopup (view, options) {
        let { fadeBackground } = options;

        let regionEl = $('<div>');
        let popupId = _.uniqueId(POPUP_ID_PREFIX);
        let config = {
            view,
            options,
            regionEl,
            popupId
        };

        this.$el.append(regionEl);
        this.addRegion(popupId, { el: regionEl });
        this.getRegion(popupId).show(view);

        if (fadeBackground) {
            let lastFaded = _.last(this.__stack.filter(x => x.options.fadeBackground));
            if (lastFaded) {
                lastFaded.regionEl.removeClass(classes.POPUP_FADE);
            } else {
                this.__toggleFadedBackground(true);
            }
            regionEl.addClass(classes.POPUP_FADE);
        }

        this.__stack.push(config);
        return popupId;
    },

    closePopup (popupId = null) {
        if (this.__stack.length === 0) {
            return;
        }

        let index = 0;
        if (popupId) {
            index = this.__stack.findIndex(x => x.popupId === popupId);
        } else {
            index = this.__stack.length - 1;
        }
        if (index !== -1) {
            while (this.__stack.length > index) {
                let popupDef = this.__stack.pop();
                this.removeRegion(popupDef.popupId);
                popupDef.regionEl.remove();
            }
        }

        let lastFaded = _.last(this.__stack.filter(x => x.options.fadeBackground));
        if (lastFaded) {
            lastFaded.regionEl.addClass(classes.POPUP_FADE);
        } else {
            this.__toggleFadedBackground(this.__forceFadeBackground);
        }
    },

    fadeBackground (fade) {
        this.__forceFadeBackground = fade;
        this.__toggleFadedBackground(this.__forceFadeBackground || this.__stack.find(x => x.options.fadeBackground));
    },

    __toggleFadedBackground (fade) {
        this.ui.fadingPanel.toggleClass('fadingPanel_open', fade);
    }
});
