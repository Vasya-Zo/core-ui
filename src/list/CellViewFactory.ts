import { objectPropertyTypes, contextIconType } from '../Meta';
import { dateHelpers, userHelpers } from 'utils';
import FieldView from '../form/fields/FieldView';
import ExtensionIconService from '../form/editors/impl/document/services/ExtensionIconService';
import DateTimeService from '../form/editors/services/DateTimeService';
import getIconPrefixer from '../utils/handlebars/getIconPrefixer';
import editableCellField from './templates/editableCellField.hbs';
import compositeDocumentCell from './templates/compositeDocumentCell.html';
import compositeUserCell from './templates/compositeUserCell.html';
import compositeReferenceCell from './templates/compositeReferenceCell.html';

let factory: {
    getCellViewForColumn: Function,
    getCell: Function,
    __getStringCell: Function,
    __getNumberCell: Function,
    __getDateTimeCell: Function,
    __getDurationCell: Function,
    __getBooleanCell: Function,
    __getReferenceCell: Function,
    __getDocumentCell: Function,
    __getUserCell: Function,
    __getMultivalueCellView: Function,
    __createContextString: Function,
    __getTitle: Function,
    __getCellClass: Function,
    __getWrappedTemplate: Function
};

type Column = {
    key: string,
    customClass: string,
    editable: boolean,
    type: string,
    dataType: string,
    format: string,
    formatOptions?: {
        intlOptions?: {
            useGrouping: boolean,
            maximumFractionDigits: number
        },
        allowFloat?: boolean,
        dateDisplayFormat?: string,
        timeDisplayFormat?: string
    },
    titleAttribute?: string
}; //todo wtf datatype

type MultivalueCellOptions = { childTemplate?: string, values?: any[], title?: string, column?: Column };

const CellFieldView = class CellFieldViewClass extends FieldView {
    constructor(options: { template: string }) {
        options.template = editableCellField;
        super(options);
    }
};

export default (factory = {
    getCellViewForColumn(column: Column, model: Backbone.Model) {
        if (column.editable) {
            return CellFieldView;
        }

        return factory.getCell(column, model);
    },

    getCell(column: Column, model: Backbone.Model) {
        const value = model.get(column.key);

        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
            return `<td class="${this.__getCellClass(column)}"></td>`;
        }

        let values = Array.isArray(value) ? value : [value];

        switch (column.dataType || column.type) {
            case objectPropertyTypes.EXTENDED_STRING:
                return this.__createContextString({ values, column, model });
            case objectPropertyTypes.INSTANCE:
                return this.__getReferenceCell({ values, column, model });
            case objectPropertyTypes.ACCOUNT:
                return this.__getUserCell({ values, column, model });
            case objectPropertyTypes.ENUM:
                values = value ? value.valueExplained : '';
                return `<td class="${this.__getCellClass(column)}" title="${this.__getTitle({ values, column, model })}">${values}</td>`;
            case objectPropertyTypes.INTEGER:
            case objectPropertyTypes.DOUBLE:
            case objectPropertyTypes.DECIMAL:
                return this.__getNumberCell({ values, column, model });
            case objectPropertyTypes.DURATION:
                return this.__getDurationCell({ values, column, model });
            case objectPropertyTypes.BOOLEAN:
                return this.__getBooleanCell(values, column);
            case objectPropertyTypes.DATETIME:
                return this.__getDateTimeCell({ values, column, model });
            case objectPropertyTypes.DOCUMENT:
                return this.__getDocumentCell({ values, column, model });
            case objectPropertyTypes.STRING:
            default:
                return this.__getStringCell({ values, column, model });
        }
    },

    __getStringCell({ values, column, model }: { values: string[], column: Column, model: Backbone.Model }) {
        if (values.length === 1) {
            return `<td class="${this.__getCellClass(column)}" title="${this.__getTitle({ values, column, model })}">${values[0] || ''}</td>`;
        }

        return this.__getMultivalueCellView({
            values: values.map(v => ({ value: v })),
            childTemplate: '{{{value}}}',
            title: this.__getTitle({ values, column, model }),
            column
        });
    },

    __getNumberCell({ values, column, model }: { values: number[], column: Column, model: Backbone.Model }) {
        const mappedValues = values.map(value => {
            if (value == null) {
                return '';
            }
            if (column.formatOptions) {
                if (column.formatOptions.intlOptions) {
                    return new Intl.NumberFormat(Localizer.langCode, column.formatOptions.intlOptions).format(value);
                } else if (column.formatOptions.allowFloat === false) {
                    return Math.floor(value);
                }
            }

            return value;
        });

        const title = this.__getTitle({ column, model, values: mappedValues });

        if (values.length === 1) {
            return `<td class="${this.__getCellClass(column)} " title="${title}">${mappedValues[0]}</td>`;
        }

        return this.__getMultivalueCellView({
            values: mappedValues.map(v => ({ value: v })),
            childTemplate: '{{value}}',
            title,
            column
        });
    },

    __getDateTimeCell({ values, column, model }: { values: string[], column: Column, model: Backbone.Model }) {
        const mappedValues = values.map(value => {
            if (column.formatOptions) {
                const dateDisplayValue = column.formatOptions.dateDisplayFormat ? DateTimeService.getDateDisplayValue(value, column.formatOptions.dateDisplayFormat) : '';
                const timeDisplayValue = column.formatOptions.timeDisplayFormat ? DateTimeService.getTimeDisplayValue(value, column.formatOptions.timeDisplayFormat) : '';
                return `${dateDisplayValue} ${timeDisplayValue}`;
            }
            return dateHelpers.dateToDateTimeString(value, 'generalDateShortTime');
        });

        const title = this.__getTitle({ column, model, values: mappedValues });

        if (values.length === 1) {
            return `<td class="${this.__getCellClass(column)} " title="${title}">${mappedValues[0]}</td>`;
        }

        return this.__getMultivalueCellView({
            values: mappedValues.map(v => ({ value: v })),
            childTemplate: '{{value}}',
            title,
            column
        });
    },

    __getDurationCell({ values, column, model }: { values: number[], column: Column, model: Backbone.Model }) {
        const mappedValues = values.map(value => {
            const defaultOptions = {
                allowDays: true,
                allowHours: true,
                allowMinutes: true,
                allowSeconds: true
            };
            const options = Object.assign(defaultOptions, _.pick(column.formatOptions || {}, Object.keys(defaultOptions)));
            let result = '';
            if (value === 0) {
                return '0';
            }
            if (!value) {
                return '';
            }
            let totalMilliseconds = moment.duration(value).asMilliseconds();

            if (options.allowDays) {
                result += `${Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24)) + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.DAYS')} `;
                totalMilliseconds %= 1000 * 60 * 60 * 24;
            }
            if (options.allowHours) {
                result += `${Math.floor(totalMilliseconds / (1000 * 60 * 60)) + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.HOURS')} `;
                totalMilliseconds %= 1000 * 60 * 60;
            }
            if (options.allowMinutes) {
                result += `${Math.floor(totalMilliseconds / (1000 * 60)) + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.MINUTES')} `;
                totalMilliseconds %= 1000 * 60;
            }
            if (options.allowSeconds) {
                result += `${Math.floor(totalMilliseconds / 1000) + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.SECONDS')} `;
                totalMilliseconds %= 1000;
            }
            return result;
        });

        const title = this.__getTitle({ column, model, values: mappedValues });

        if (values.length === 1) {
            return `<td class="${this.__getCellClass(column)}" title="${title}">${mappedValues[0]}</td>`;
        }

        return this.__getMultivalueCellView({
            values: mappedValues.map(v => ({ value: v })),
            childTemplate: '{{value}}',
            title,
            column
        });
    },

    __getBooleanCell(values: boolean[], column: Column) {
        const mappedValues = values
            .map(v => {
                let result = '';
                if (v === true) {
                    result = '<svg class="svg-grid-icons svg-icons_flag-yes"><use xlink:href="#icon-checked"></use></svg>';
                } else if (v === false) {
                    result = '<svg class="svg-grid-icons svg-icons_flag-none"><use xlink:href="#icon-remove"></use></svg>';
                }
                return result;
            })
            .join('');
        return `<td class="${this.__getCellClass(column)}">${mappedValues}</td>`;
    },

    __getReferenceCell({ values, column, model }: { values: Array<{ text: string, name: string }>, column: Column, model: Backbone.Model }) {
        values.forEach(value => {
            if (!value.text) {
                value.text = value.name;
            }
        });

        const title = this.__getTitle({ column, model, values: values.map(v => v.text) });

        if (values.length === 1) {
            return Handlebars.compile(`<td class="${this.__getCellClass(column)}" title="${title}">${compositeReferenceCell}</td>`)(values[0]);
        }
        return this.__getMultivalueCellView({ values, title, childTemplate: compositeReferenceCell, column });
    },

    __getDocumentCell({
        values,
        column,
        model
    }: {
        values: Array<{ icon: string, name: string, text: string, isLoading: boolean, extension: string }>,
        column: Column,
        model: Backbone.Model
    }) {
        values.forEach(value => {
            value.icon = ExtensionIconService.getIconForDocument(value.isLoading, value.extension);
            value.name = value.name || value.text;
        });

        const title = this.__getTitle({ column, model, values: values.map(v => v.name) });

        if (values.length === 1) {
            return Handlebars.compile(`<td class="${this.__getCellClass(column)}" title="${title}">${compositeDocumentCell}</td>`)(values[0]);
        }
        return this.__getMultivalueCellView({ values, title, childTemplate: compositeDocumentCell, column });
    },

    __getUserCell({ values, column, model }: { values: Array<{ abbreviation: string, name: string }>, column: Column, model: Backbone.Model }) {
        values.forEach(value => {
            if (!value.abbreviation) {
                value.abbreviation = userHelpers.getAbbreviation(value.name);
            }
        });

        const title = this.__getTitle({ column, model, values: values.map(v => v.name) });

        if (values.length === 1) {
            return Handlebars.compile(`<td class="${this.__getCellClass(column)}" title="${title}"><div class="composite-cell__wrp">${compositeUserCell}</div></td>`)(values[0]);
        }

        return this.__getMultivalueCellView({ values, title, childTemplate: compositeUserCell, column });
    },

    __getMultivalueCellView({ childTemplate, values = [], title, column }: MultivalueCellOptions = {}): Node {
        const panelViewOptions = {
            collection: new Backbone.Collection(values.slice(1)),
            className: 'grid-composite_panel',
            childView: Marionette.View,
            childViewOptions: {
                tagName: 'div',
                className: 'composite-cell_container'
            }
        };

        const buttonViewData: { value?: any, count: number } = {
            count: values.length - 1
        };

        if (typeof values[0] === 'object') {
            Object.assign(buttonViewData, values[0]);
        } else {
            buttonViewData.value = values[0];
        }

        const buttonViewOptions = {
            model: new Backbone.Model(buttonViewData),
            tagName: 'td',
            className: `${this.__getCellClass(column)}`,
            attributes: {
                title
            }
        };
        if (childTemplate) {
            panelViewOptions.childViewOptions.template = Handlebars.compile(childTemplate);
            buttonViewOptions.template = Handlebars.compile(this.__getWrappedTemplate(childTemplate));
        }
        const menu = Core.dropdown.factory.createDropdown({
            class: 'grid_composite-cell dropdown_root',
            buttonView: Marionette.View,
            buttonViewOptions,
            panelView: Marionette.CollectionView,
            panelViewOptions
        });
        const menuEl = menu.render().el;
        return menuEl;
    },

    __createContextString({ values, column, model }: { values: string[], column: Column, model: Backbone.Model }) {
        const type = contextIconType[model.get('type').toLocaleLowerCase()];
        const getIcon = getIconPrefixer(type);
        return `
            <td class="js-extend_cell_content extend_cell_content " title="${this.__getTitle({ values, column, model })}">
            <i class="${getIcon(type)} context-icon" aria-hidden="true"></i>
            <div class="extend_cell_text">
                <span class="extend_cell_header">${values.join(', ')}</span>
                <span class="extend_info">${model.get('alias') || ''}</span>
            </div>
            </td>`;
    },

    __getTitle({ values, column, model }: { values: string[] | string, column: Column, model: Backbone.Model }) {
        let title;
        if (column.format === 'HTML') {
            title = '';
        } else if (column.titleAttribute) {
            title = model.get(column.titleAttribute);
        } else {
            title = Array.isArray(values) ? values.join(', ') : values;
        }
        title = title !== null && title !== undefined ? title.toString().replace(/"/g, '&quot;') : '';
        return title;
    },

    __getCellClass(gridColumn: Column) {
        return `cell ${gridColumn.customClass ? `${gridColumn.customClass} ` : ''}`;
    },

    __getWrappedTemplate(template: string) {
        return `<div class="composite-cell__wrp">
            ${template}
            {{#if count}}
                <div class="composite-cell__count">+{{count}}</div>
                <i class="fa fa-angle-down bubbles__caret"></i>
            {{/if}}
        </div>`;
    }
});
