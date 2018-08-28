//@flow
import { objectPropertyTypes } from '../Meta';
import { dateHelpers } from 'utils';
import EditableGridFieldView from './views/EditableGridFieldView';
import SimplifiedFieldView from '../form/fields/SimplifiedFieldView';

let factory;

type Column = { key: string, columnClass: string, editable: boolean, type: string, dataType: string, format: string }; //todo wtf datatype

export default (factory = {
    getCellViewForColumn(column: Column, model: Backbone.Model) {
        if (column.editable) {
            return column.simplified ? SimplifiedFieldView : EditableGridFieldView;
        }

        return factory.getCellHtml(column, model);
    },

    getCellHtml(column: Column, model: Backbone.Model) {
        const value = model.get(column.key);

        if (value == null) {
            return `<div class="cell ${column.columnClass}"></div>`;
        }
        let adjustedValue = value;

        switch (column.type) {
            case objectPropertyTypes.STRING:
                adjustedValue = this.__adjustValue(value);
                return `<div class="cell ${column.columnClass}" title="${column.format === 'HTML' ? '' : adjustedValue}">${adjustedValue}</div>`;
            case objectPropertyTypes.INSTANCE:
                if (Array.isArray(value)) {
                    adjustedValue = value.map(v => v && v.name).join(', ');
                } else if (value && value.name) {
                    adjustedValue = value.name;
                }
                return `<div class="cell ${column.columnClass}" title="${adjustedValue || ''}">${adjustedValue || ''}</div>`;
            case objectPropertyTypes.ACCOUNT:
                if (value.length > 0) {
                    adjustedValue = value
                        .map(item => ({
                            id: item.id,
                            text: item.text || item.name || (item.columns && item.columns[0])
                        }))
                        .sort((a, b) => a.text > b.text)
                        .reduce((memo, member) => {
                            if (memo) {
                                return `${memo}, ${member.text}`;
                            }
                            return member.text;
                        }, null);
                    return `<div class="cell ${column.columnClass}" title="${adjustedValue} || ''">${adjustedValue}</div>`;
                } else if (value.name) {
                    return `<div class="cell ${column.columnClass}" title="${value.name}">${value.name}</div>`;
                }
            case objectPropertyTypes.ENUM:
                adjustedValue = value ? value.valueExplained : '';
                return `<div class="cell ${column.columnClass}" title="${adjustedValue}">${adjustedValue}</div>`;
            case objectPropertyTypes.INTEGER:
            case objectPropertyTypes.DOUBLE:
            case objectPropertyTypes.DECIMAL:
                adjustedValue = this.__adjustValue(value) || '';
                return `<div class="cell cell-right ${column.columnClass}" title="${adjustedValue}">${adjustedValue}</div>`;
            case objectPropertyTypes.DURATION: {
                adjustedValue = Array.isArray(value) ? value : [value];
                adjustedValue = adjustedValue
                    .map(v => {
                        let result = '';
                        if (value === 0) {
                            return '0';
                        }
                        if (!value) {
                            return '';
                        }

                        const duration = dateHelpers.durationISOToObject(value);
                        if (duration.days) {
                            result += `${duration.days + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.DAYS')} `;
                        }
                        if (duration.hours) {
                            result += `${duration.hours + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.HOURS')} `;
                        }
                        if (duration.minutes) {
                            result += `${duration.minutes + Localizer.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.MINUTES')} `;
                        }
                        return result;
                    })
                    .join(', ')
                    .trim();

                return `<div class="cell ${column.columnClass}" title="${adjustedValue}">${adjustedValue}</div>`;
            }
            case objectPropertyTypes.BOOLEAN:
                adjustedValue = Array.isArray(value) ? value : [value || ''];
                adjustedValue = adjustedValue
                    .map(v => {
                        let result = '';
                        if (v === true) {
                            result = '<svg class="svg-grid-icons svg-icons_flag-yes"><use xlink:href="#icon-checked"></use></svg>';
                        } else if (v === false) {
                            result = '<svg class="svg-grid-icons svg-icons_flag-none"><use xlink:href="#icon-remove"></use></svg>';
                        }
                        return result;
                    })
                    .join(', ');
                return `<div class="cell ${column.columnClass}">${adjustedValue}</div>`;
            case objectPropertyTypes.DATETIME:
                adjustedValue = Array.isArray(value) ? value : [value];
                adjustedValue = adjustedValue
                    .map(v => dateHelpers.dateToDateTimeString(v, column.format || 'generalDateShortTime')).join(', ');
                return `<div class="cell ${column.columnClass}" title="${adjustedValue}">${adjustedValue}</div>`;
            case objectPropertyTypes.DOCUMENT:
                if (value.length > 0) {
                    return `<div class="cell ${column.columnClass}">${value
                        .map(item => {
                            const text = item.text || item.name || (item.columns && item.columns[0]);
                            const url = item.url || (item.columns && item.columns[1]);
                            return `<a href="${url}" target="_blank" title="${text}">${text}</a>`;
                        })
                        .sort((a, b) => a.text > b.text)
                        .join(', ')}</div>`;
                }
            default:
                adjustedValue = this.__adjustValue(value);
                return `<div class="cell ${column.columnClass}">${adjustedValue || ''}</div>`;
        }
    },

    __adjustValue(value: Array<string | number> | string) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    }
});
