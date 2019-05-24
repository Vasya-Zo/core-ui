import { objectPropertyTypes } from '../Meta';

export const contextTypes = {
    void: 'void',
    any: 'any',
    one: 'one'
};

export const queryBuilderActions = {
    sort: 'sort',
    group: 'group',
    filter: 'filters',
    aggregation: 'aggregation'
};

export const sortDirection = {
    ascending: 'Asc',
    descending: 'Desc'
};

export const columnTypes = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    DATETIME: 'dateTime',
    HTML: 'html',
    DOCUMENT: 'document',
    decimal: 'Decimal',
    integer: 'Integer',
    datetime: 'DateTime',
    duration: 'Duration',
    string: 'String',
    boolean: 'Boolean',
    users: 'AccountProperty',
    reference: 'InstanceProperty',
    enumerable: 'EnumProperty',
    document: 'DocumentProperty',
    collection: 'Collection',
    id: 'id'
};

export const columnWidthByType = {
    [objectPropertyTypes.ACCOUNT]: 120,
    [objectPropertyTypes.BOOLEAN]: 120,
    [objectPropertyTypes.COLLECTION]: 120,
    [objectPropertyTypes.DATETIME]: 120,
    [objectPropertyTypes.DECIMAL]: 120,
    [objectPropertyTypes.DOCUMENT]: 120,
    [objectPropertyTypes.DOUBLE]: 120,
    [objectPropertyTypes.DURATION]: 120,
    [objectPropertyTypes.ENUM]: 120,
    [objectPropertyTypes.EXTENDED_STRING]: 120,
    [objectPropertyTypes.INSTANCE]: 120,
    [objectPropertyTypes.INTEGER]: 120,
    [objectPropertyTypes.STRING]: 120
};

export const getDefaultActions = () => [
    {
        id: 'add',
        name: Localizer.get('CORE.GRID.ACTIONS.ADD'),
        iconClass: 'plus'
    },
    {
        id: 'archive',
        name: Localizer.get('CORE.GRID.ACTIONS.ARCHIVE'),
        contextType: contextTypes.any
    },
    {
        id: 'unarchive',
        name: Localizer.get('CORE.GRID.ACTIONS.UNARCHIVE'),
        contextType: contextTypes.any
    },
    {
        id: 'delete',
        name: Localizer.get('CORE.GRID.ACTIONS.DELETE'),
        contextType: contextTypes.any
    }
];

export const filterPredicates = {
    between: 'between',
    substringOf: 'substringof',
    notSubstringOf: 'notsubstringof',
    startsWith: 'startsWith',
    endsWith: 'endswith',
    equal: 'eq',
    notEqual: 'ne',
    greaterThan: 'gt',
    greaterOrEquals: 'ge',
    lessThan: 'lt',
    lessOrEquals: 'le',
    greateThan: 'gt',
    notSet: 'ns',
    set: 'se'
};

export const aggregationPredicates = {
    sum: 'sum',
    count: 'count'
};

export const booleanDropdown = {
    yes: true,
    no: false,
    null: null
};

export const hiddenByUserClass = 'hidden-by-user';

export default {
    contextTypes,
    columnTypes,
    getDefaultActions
};
