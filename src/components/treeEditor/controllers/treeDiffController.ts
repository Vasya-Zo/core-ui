const personalConfigProps = ['index', 'width', 'isHidden']; //TODO add them dynamically (personalConfigProps aggregator)

const findAllDescendants = (model, predicate) => {
    if (!model.isContainer) {
        return null;
    }
    const result = [];
    const children = model.getChildren && typeof model.getChildren === 'function' ? model.getChildren() : model.get(model.childrenAttribute);
    children.forEach(c => {
        if (!predicate || predicate(c)) {
            result.push(c);
        }
        const r = findAllDescendants(c, predicate);
        if (r && r.length > 0) {
            result.push(...r);
        }
    });
    return result;
};

// const OldConfig = class {
//     constructor(model) {
//         this.model = model;
//         this.config = {};
//     }

//     setConfigItem(propName) {
//         const propValue = this.model.get(propName);
//         if (propValue != null) {
//             this.config[propName] = propValue;
//         }
//     }

//     getConfig() {
//         return this.config;
//     }
// };

const objectsDeepComparison = (objOne, objTwo) => {
    const props = [...new Set([...Object.keys(objOne), ...Object.keys(objTwo)])];

    return props.every(prop => {
        if (objOne[prop] instanceof Object && objTwo[prop] instanceof Object) {
            return objectsDeepComparison(objOne[prop], objTwo[prop]);
        }
        return objOne[prop] === objTwo[prop];
    });
};

export default class TreeDiffController {
    widgetSettings: {};

    constructor(options) {
        const { configDiff, formModel, reqres } = options;

        this.configuredCollectionsSet = new Set();
        this.__initConfiguration(configDiff);
        this.__initDescendants({ formModel, reqres });

        reqres.reply('treeEditor:setWidgetConfig', (widgetId, config) => this.__setWidgetConfig(widgetId, config));

        this.__applyPersonalConfig();
    }

    // map server data, set inital widgetSettings array
    __initConfiguration(configDiff) {
        //TODO move it to product mapper
        // this.personalConfiguration.forEach(cfg => {
        //     Object.entries(cfg).forEach(([key, value]) => {
        //         if (!value) {
        //             delete cfg[key];
        //         } else if (key === 'index') {
        //             cfg.index -= 1; //on server side index starts from 1, and index = 0 means that item wasn't moved
        //         }
        //     });
        // });

        this.widgetSettings = { ...configDiff }; // ? this.personalConfiguration.slice() : [];
    }

    __initDescendants(options) {
        const { formModel } = options;
        const collectionsSet = new Set();

        const allFMDescendantsArray =
            formModel.findAllDescendants && typeof formModel.findAllDescendants === 'function' ? formModel.findAllDescendants() : findAllDescendants(formModel);
        this.allFMDescendants = allFMDescendantsArray.reduce((allDesc, model) => ((allDesc[model.id] = model), allDesc), {});

        const keys = Object.keys(this.allFMDescendants);
        const set = new Set(keys);
        if (keys.length !== set.size) {
            Core.InterfaceError.logError('Error: graph models have non-unique ids. You must to reboot your computer immediately!!!');
        }

        Object.values(this.allFMDescendants).map(model => {
            const initialConfig = {};

            personalConfigProps.map(prop => {
                const propValue = model.get(prop);
                if (propValue != null) {
                    initialConfig[prop] = propValue;

                    return;
                }
            });

            model.initialConfig = initialConfig;

            if (model.collection) {
                collectionsSet.add(model.collection);
            }
        });

        collectionsSet.forEach(coll => (coll.initialCollectionConfig = coll.map(m => m.id)));

        // Object.values(this.allFMDescendants).map(x => x.listenTo(x, 'change:0 change:1 change:2', m => console.log(m)));
    }

    // set given widget's personal config to widgetSettings array
    __setWidgetConfig(widgetId, keyValue) {
        const [key, value] = Object.entries(keyValue)[0];
        const initialValue = this.allFMDescendants[widgetId].initialConfig[key];
        const isDefault = (() => {
            if (key === 'index') {
                const model = this.allFMDescendants[widgetId];

                return value === model.collection.initialCollectionConfig.indexOf(model.id);
            }
            return !value || value === initialValue; // here "!value" means: isHidden===false or width===0
        })();

        if (this.widgetSettings[widgetId]) {
            if (isDefault) {
                // unset property if it is equal to default (for perfomance purpose)
                delete this.widgetSettings[widgetId][key];
                if (!Object.keys(this.widgetSettings[widgetId]).length) {
                    delete this.widgetSettings[widgetId];
                }

                return;
            }

            Object.assign(this.widgetSettings[widgetId], keyValue);

            return;
        }

        if (!isDefault) {
            this.widgetSettings[widgetId] = keyValue;
        }
    }

    // apply personal config to graphModel
    __applyPersonalConfig() {
        Object.entries(this.allFMDescendants).forEach(([modelId, model]) => {
            //if we come to the situation where we return to initial state, we don't want to apply any changes
            if (this.widgetSettings[modelId] && objectsDeepComparison(this.widgetSettings[modelId], model.initialConfig)) {
                delete this.widgetSettings[modelId];
            }

            const config = this.widgetSettings[modelId] || model.initialConfig;

            if (Object.keys(config).length) {
                model.set(config);
            }

            personalConfigProps.filter(prop => config[prop] == null).map(prop => model.unset(prop));

            const collection = model.collection;
            if (collection) {
                // if ( config.index == null) {
                if (collection.initialCollectionConfig.indexOf(model.id) != collection.indexOf(model)) {
                    this.configuredCollectionsSet.add(collection);
                }
                // } else {
                //     this.resetedCollectionsSet
                // }
            }
        });

        // if (this.configuredCollectionsSet.size) {
        this.configuredCollectionsSet.forEach(coll => {
            this.reorderCollectionByIndex(coll);
            if (coll.initialCollectionConfig.every((id, i) => coll.at(i).id === id)) {
                console.log('returned to inital state');
                this.configuredCollectionsSet.delete(coll);
            }
        });
        // }

        // if (resetedCollectionsSet.size) {
        //     resetedCollectionsSet.forEach(coll => {
        //         TreeDiffController.__resetCollectionOrder(coll);
        //         // coll.initialCollectionConfig.map(widgetId => this.widgetSettings[widgetId] && delete this.widgetSettings[widgetId].index);
        //     });
        // }
    }

    reorderCollectionByIndex(collection) {
        // const modelsWithPersonalIndex = collection.models.slice().map(model => model.get('index') == null && model.set('index' , collection.initialCollectionConfig.indexOf(model.id)));
        // const modelsWithPersonalIndex = collection.models.slice().filter(model => model.get('index') != null);
        // const insertIndex = collection.indexOf(modelsWithPersonalIndex[0]);

        // modelsWithPersonalIndex.sort((a, b) => a.get('index') - b.get('index'));
        // collection.remove(modelsWithPersonalIndex);
        // collection.add(modelsWithPersonalIndex, { at: insertIndex });

        const init = collection.initialCollectionConfig;
        const groupsToReorder = collection
            .map(model => model.id)
            .reduce(
                (groupsAccumulator, currentId, i) => {
                    if (currentId != init[i]) {
                        groupsAccumulator[groupsAccumulator.length - 1].push(currentId);
                    } else {
                        if (groupsAccumulator[groupsAccumulator.length - 1].length) {
                            groupsAccumulator.push([]);
                        }
                    }
                    return groupsAccumulator;
                },
                [[]]
            )
            .filter(group => group.length);

        groupsToReorder.map(group => {
            console.log('', collection, group); //collection.indexOf();
            const modelsGroup = [...collection.filter(x => group.includes(x.id))];
            const insertIndex = collection.indexOf(modelsGroup[0]);
            modelsGroup.sort((a, b) => {
                const aIndex = a.get('index') == null ? init.indexOf(a.id) : a.get('index');
                const bIndex = b.get('index') == null ? init.indexOf(b.id) : b.get('index');

                return aIndex - bIndex;
            });

            collection.remove(modelsGroup);
            collection.add(modelsGroup, { at: insertIndex });
        });
    }

    // static __resetCollectionOrder(collection) {
    //     const collectionIds = collection.map(model => model.id);
    //     const filteredСhunkIds = collectionIds.filter((id, i) => id !== collection.initialCollectionConfig[i]);
    //     const insertIndex = collectionIds.indexOf(filteredСhunkIds[0]);
    //     const initialСhunkIds = [...collection.initialCollectionConfig].splice(insertIndex, filteredСhunkIds.length);

    //     //TODO possible bug: can have muliple chunks

    //     const chunkModels = collection.filter(model => initialСhunkIds.includes(model.id));
    //     chunkModels.map(model => model.unset('index'));

    //     collection.remove(chunkModels);
    //     collection.add(chunkModels, { at: insertIndex });
    //     //TODO move to personalConfigController
    //     // if (collection.parents[0].get('fieldType') === componentTypes.COLLECTION) {
    //     //     collection.trigger('columns:move');
    //     // }
    // }
}
