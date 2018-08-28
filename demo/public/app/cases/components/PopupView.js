export default function() {
    const model = new Backbone.Model({
        name: 'new operation',
        idealDays: 12,
        dueDate: '2015-07-20T10:46:37Z',
        description: 'no-op',
        computed: false
    });

    const formSchema = {
        name: {
            title: 'Name',
            type: 'Text'
        },
        idealDays: {
            title: 'Ideal Days',
            type: 'Number'
        },
        dueDate: {
            title: 'Due Date',
            type: 'DateTime'
        },
        description: {
            title: 'Description',
            type: 'TextArea'
        },
        computed: {
            type: 'Boolean',
            displayText: 'Computed via expression'
        },
        expression: {
            type: 'TextArea'
        }
    };

    const createPopup = () =>
        new Core.layout.Popup({
            size: {
                width: '800px',
                height: '700px'
            },
            header: 'New Operation',
            buttons: [
                {
                    id: false,
                    text: 'Cancel',
                    customClass: 'btn-small btn-outline',
                    handler(popup) {
                        Core.services.WindowService.closePopup();
                    }
                },
                {
                    id: true,
                    text: 'Save',
                    customClass: 'btn-small',
                    handler(popup) {
                        popup.content.form.commit();
                        Core.services.WindowService.closePopup();
                        alert(JSON.stringify(model.toJSON(), null, 4));
                    }
                }
            ],
            content: new Core.layout.Form({
                model,
                schema: formSchema,
                content: new Core.layout.TabLayout({
                    tabs: [
                        {
                            id: 'general',
                            name: 'General',
                            view: new Core.layout.VerticalLayout({
                                rows: [
                                    Core.layout.createFieldAnchor('name'),
                                    new Core.layout.HorizontalLayout({
                                        columns: [Core.layout.createFieldAnchor('idealDays'), Core.layout.createFieldAnchor('dueDate')]
                                    }),
                                    Core.layout.createFieldAnchor('description'),
                                    Core.layout.createEditorAnchor('computed')
                                ]
                            })
                        },
                        {
                            id: 'expression',
                            name: 'Computed Expression',
                            view: Core.layout.createEditorAnchor('expression')
                        }
                    ]
                })
            })
        });

    const View = Marionette.View.extend({
        template: Handlebars.compile('<input class="js-show-popup" type="button" value="Show Popup" />'),

        events: {
            'click .js-show-popup'() {
                Core.services.WindowService.showPopup(createPopup());
            }
        }
    });

    return new View();
}
