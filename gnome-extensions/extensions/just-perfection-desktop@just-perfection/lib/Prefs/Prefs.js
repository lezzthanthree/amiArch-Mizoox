/**
 * Prefs Library
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2026
 * @license    GPL-3.0-only
 */

/**
 * prefs widget for showing prefs window
 */
export class Prefs
{
    /**
     * Current shell version
     *
     * @type {number|null}
     */
    #shellVersion = null;

    /**
     * Instance of PrefsKeys
     *
     * @type {import('./PrefsKeys.js').PrefsKeys|null}
     */
    #prefsKeys = null;

    /**
     * Instance of Gtk.Builder
     *
     * @type {Gtk.Builder|null}
     */
    #builder = null;

    /**
     * Instance of Gio.Settings
     *
     * @type {Settings|null}
     */
    #settings = null;

    /**
     * Instance of Gtk.CssProvider
     *
     * @type {Gtk.CssProvider|null}
     */
    #cssProvider = null;

    /**
     * Instance of Resource
     *
     * @type {Gio.Resource|null}
     */
    #resource = null;

    /**
     * Instance of Adw
     *
     * @type {Adw|null}
     */
    #adw = null;

    /**
     * Instance of Gtk
     *
     * @type {Gtk|null}
     */
    #gtk = null;

    /**
     * Instance of Gdk
     *
     * @type {Gdk|null}
     */
    #gdk = null;

    /**
     * Instance of Gio
     *
     * @type {Gio|null}
     */
    #gio = null;

    /**
     * Instance of GLib
     *
     * @type {GLib|null}
     */
    #glib = null;

    /**
     * All available profile names
     *
     * @type {Array}
     */
    #profiles = [
        'default',
        'minimal',
        'superminimal',
    ];

    /**
     * All available crypto addresses for donation
     *
     * The order should be the same as what we have in the combobox .ui file
     *
     * @type {Array}
     */
    #cryptoAddresses = [
        ['Dogecoin', 'DULPjoiDuhZCmv5LDeJuqYPC8Uy7NK7DnW'],
        ['Bitcoin', 'bc1qn6p0k8sapmxgedn8qjhd5gm2yzy46t5s296lnd'],
        ['Bitcoin Cash', 'qzhuj2kdw4zjrg8r2j7knx5uzqdcpv5lwv5uxq04e0'],
        ['Ethereum', '0xE4A6C46E1095C49688645c132672cB04d1402026'],
        ['XRP', 'rEneFYpbFmTB7ejLphTwjsj8ityezR1NeY'],
        ['USDT', '0xE4A6C46E1095C49688645c132672cB04d1402026'],
        ['USDC', '0xE4A6C46E1095C49688645c132672cB04d1402026'],
        ['Solana', '3M9d8arcHiuqAwso9zTX4pvZRoaeVVomkovWmGCYgDG2'],
        ['Cardano', 'addr1qxgrpcsdpyuh7dl4m2mk2vpuss68zjze9y83wpsuxjyafg5sxr3q6zfe0umltk4hv5crepp5w9y9j2g0zurpcdyf6j3qeu2hqs'],
        ['BNB', '0xE4A6C46E1095C49688645c132672cB04d1402026'],
        ['LTC', 'LVz4se3wepdgCNGkE8V53VB47ViAjZb7F1'],
        ['XLM', 'GDZOVYXD6PGG77V5HGHN767AGPIYZ3ZHNUC53BSXMIDRSTKVFVUJJFHZ'],
        ['Monero', '49uPJDZCoFJMoeLAZKDpuTScHjdfgfzksMNurZdt2J4x8meKUZZwUiq3tBs9xYVq9G8PzxjwH6zkXeEZKz3JgdfiGo3aZN5'],
        ['LBRY', 'bPMi1WVgtMDjdX3V4ofAtMt5qMj4xYM4A1'],
        ['Shiba Inu', '0xE4A6C46E1095C49688645c132672cB04d1402026'],
    ];

    /**
     * class constructor
     *
     * @param {Object} dependencies
     *   'Builder' instance of Gtk.Builder
     *   'Settings' instance of Gio.Settings
     *   'CssProvider': instance of Gtk.CssProvider
     *   'Adw' reference to Adw
     *   'Gtk' reference to Gtk
     *   'Gdk' reference to Gdk
     *   'Gio' reference to Gio
     *   'GLib' reference to GLib
     * @param {PrefsKeys.PrefsKeys} prefsKeys - instance of PrefsKeys
     * @param {number} shellVersion - float in major.minor format
     */
    constructor(dependencies, prefsKeys, shellVersion)
    {
        this.#settings = dependencies['Settings'] || null;
        this.#builder = dependencies['Builder'] || null;
        this.#cssProvider = dependencies['CssProvider'] || null;
        this.#adw = dependencies['Adw'] || null;
        this.#gtk = dependencies['Gtk'] || null;
        this.#gdk = dependencies['Gdk'] || null;
        this.#gio = dependencies['Gio'] || null;
        this.#glib = dependencies['GLib'] || null;

        this.#prefsKeys = prefsKeys;
        this.#shellVersion = shellVersion;
    }

    /**
     * fill prefs window
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     * @param {string} resourcesFolderPath folder path to resources folder
     * @param {string} gettextDomain gettext domain
     *
     * @returns {void}
     */
     fillPrefsWindow(window, resourcesFolderPath, gettextDomain)
     {
         // changing the order here can change the elements order in ui
         let uiFilenames = [
             'menu',
             'pages/profile',
             'pages/visibility',
             'pages/behavior',
             'pages/customize',
         ];

         this.#loadResource(resourcesFolderPath);

         this.#cssProvider.load_from_resource(
            `/org/gnome/Shell/Extensions/justperfection/css/prefs.css`
         );
         this.#gtk.StyleContext.add_provider_for_display(
            this.#gdk.Display.get_default(),
            this.#cssProvider,
            this.#gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
         );

         this.#builder.set_translation_domain(gettextDomain);
         for (let uiFilename of uiFilenames) {
            this.#builder.add_from_resource(
                `/org/gnome/Shell/Extensions/justperfection/ui/${uiFilename}.ui`
            );
         }

         for (let uiFilename of uiFilenames) {
             if (!uiFilename.startsWith('pages/')) {
                 continue;
             }
             let page = this.#builder.get_object(uiFilename.replace('pages/', ''));
             window.add(page);
         }

         this.#addMainMenu(window);
         this.#setValues();
         this.#guessProfile();
         this.#onlyShowSupportedRows();
         this.#loadCryptoSupportAddress();
         this.#registerAllSignals(window);
         this.#registerAllActions(window);

         this.#setWindowSize(window);

         window.search_enabled = true;
     }

    /**
     * load resource
     *
     * @param {string} folder path to the resources folder
     *
     * @returns {void}
     */
    #loadResource(path)
    {
        this.#resource = this.#gio.Resource.load(`${path}/resources.gresource`);
        this.#gio.resources_register(this.#resource);
    }

    /**
     * set window size
     *
     * @param {Adw.PreferencesWindow} window prefs window
     *
     * @returns {void}
     */
    #setWindowSize(window)
    {
        let [pmWidth, pmHeight, pmScale] = this.#getPrimaryMonitorInfo();
        let sizeTolerance = 50;
        let width = 640;
        let height = 750;

        if (
            (pmWidth / pmScale) - sizeTolerance >= width &&
            (pmHeight / pmScale) - sizeTolerance >= height
        ) {
            window.set_default_size(width, height);
        }
    }

    /**
     * get primary monitor info
     *
     * @returns {Array} [width, height, scale]
     */
    #getPrimaryMonitorInfo()
    {
        let display = this.#gdk.Display.get_default();

        let pm = display.get_monitors().get_item(0);

        if (!pm) {
            return [700, 500, 1];
        }

        let geo = pm.get_geometry();
        let scale = pm.get_scale_factor();

        return [geo.width, geo.height, scale];
    }

     /**
      * get header bar widget
      *
      * @param {Gtk.Widget} parent the widget that may contain the header bar
      *
      * @returns {void}
      */
     #getHeaderBar(parent)
     {
        const children = parent.observe_children();

        if (!children) {
            return null;
        }

        for (let i = 0; i < children.get_n_items(); i++) {
            const child = children.get_item(i);
            if (child instanceof this.#adw.HeaderBar) {
                return child;
            }
            const widget = this.#getHeaderBar(child);
            if (widget) {
                return widget;
            }
        }

        return null;
    }

    /**
     * add main menu to the header bar
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #addMainMenu(window)
    {
        let headerBar = this.#getHeaderBar(window);

        headerBar?.pack_end(this.#builder.get_object('menu_button'));
    }

    /**
     * register all actions
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #registerAllActions(window)
    {
        this.#registerLinksActions(window);
    }

    /**
     * register links action
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #registerLinksActions(window)
    {
        let group = new this.#gio.SimpleActionGroup();
        window.insert_action_group('links', group);

        let openUriAction = new this.#gio.SimpleAction({
            name: 'open-uri',
            parameter_type: new this.#glib.VariantType('s'),
        });
        openUriAction.connect(
            'activate',
            (_self, target) => {
                const uri = target.get_string()[0];
                this.#gio.AppInfo.launch_default_for_uri(uri, null);
            }
        );

        group.add_action(openUriAction);
    }

    /**
     * register all signals
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #registerAllSignals(window)
    {
        this.#registerKeySignals();
        this.#registerProfileSignals();
        this.#registerCryptoSupportSignals(window);
        this.#registerCloseSignal(window);
    }

    /**
     * register close signal
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #registerCloseSignal(window)
    {
        window.connect('close-request', () => {
            if (this.#resource) {
                this.#gio.resources_unregister(this.#resource);
            }
        });
    }

    /**
     * register signals of all prefs keys
     *
     * @returns {void}
     */
    #registerKeySignals()
    {
        // all available keys
        for (let [, key] of Object.entries(this.#prefsKeys.keys)) {

            switch (key.widgetType) {

                case 'GtkSwitch':
                    this.#builder.get_object(key.widgetId).connect('state-set', (w) => {
                        this.#settings.set_boolean(key.name, w.get_active());
                        this.#guessProfile();
                    });
                    break;

                case 'AdwActionRow':
                    this.#builder.get_object(key.widgetId).connect('notify::selected-item', (w) => {
                        let index = w.get_selected();
                        let value = (index in key.maps) ? key.maps[index] : index;
                        this.#settings.set_int(key.name, value);
                        this.#guessProfile();
                    });
                    break;

                case 'AdwSpinRow':
                    this.#builder.get_object(key.widgetId).connect('notify::value', (w) => {
                        let value = w.get_value();
                        this.#settings.set_int(key.name, value);
                        this.#guessProfile();
                    });
                    break;
            }
        }
    }

    /**
     * register profile signals
     *
     * @returns {void}
     */
    #registerProfileSignals()
    {
        for (let profile of this.#profiles) {
            let widget = this.#builder.get_object(`profile_${profile}`);
            if (!widget) {
                break;
            }
            widget.connect('clicked', (w) => {
                this.#setValues(profile);
            });
        }
    }

    /**
     * register crypto support signals
     *
     * @param {Adw.PreferencesWindow} window prefs dialog
     *
     * @returns {void}
     */
    #registerCryptoSupportSignals(window)
    {
        let comboRow = this.#builder.get_object(`support_crypto_row`);
        let copyButton = this.#builder.get_object(`crypto_address_copy_button`);
        let addressEntry = this.#builder.get_object(`crypto_address_row`);
        let toast = this.#builder.get_object(`toast_added_to_clipboard`);

        comboRow.connect('notify::selected-item', (w) => {
            let selectedIndex = w.get_selected();
            this.#loadCryptoSupportAddress(selectedIndex);
        });

        copyButton.connect('clicked', () => {
            let display = this.#gdk.Display.get_default();
            let clipboard = display.get_clipboard();
            clipboard.set(addressEntry.text);
            window.add_toast(toast);
        });
    }

    /**
     * load crypto address into the ui
     *
     * @param {number} index coming from the crypto name combobox
     *
     * @returns {void}
     */
    #loadCryptoSupportAddress(index = 0)
    {
        let addressEntry = this.#builder.get_object(`crypto_address_row`);
        let qrPicture = this.#builder.get_object(`qr_picture`);

        let name = this.#cryptoAddresses[index][0];
        let filename = name.replace(' ', '-').toLowerCase();
        let address = this.#cryptoAddresses[index][1]

        qrPicture.set_resource(
            `/org/gnome/Shell/Extensions/justperfection/imgs/qr-${filename}.svg`
        );
        addressEntry.title = `${name} Address`;
        addressEntry.text = address;
    }

    /**
     * can check all current values and guess the profile based on the values
     *
     * @returns {void}
     */
    #guessProfile()
    {
        let totalCount = 0;
        let matchCount = {};

        for (let profile of this.#profiles) {
            matchCount[profile] = 0;
        }

        for (let [, key] of Object.entries(this.#prefsKeys.keys)) {

            if (!key.supported) {
                continue;
            }

            let value;

            switch (key.widgetType) {
                case 'GtkSwitch':
                    value = this.#builder.get_object(key.widgetId).get_active();
                    break;
                case 'AdwActionRow':
                    value = this.#builder.get_object(key.widgetId).get_selected();
                    break;
                case 'AdwSpinRow':
                    value = this.#builder.get_object(key.widgetId).get_value();
                    break;
                default:
                    value = '';
                    continue;
            }

            for (let profile of this.#profiles) {
                if (key.profiles[profile] === value) {
                    matchCount[profile]++;
                }
            }

            totalCount++;
        }

        let currentProfile = 'custom';
        for (let profile of this.#profiles) {
            if (matchCount[profile] === totalCount) {
                currentProfile = profile;
                break;
            }
        }

        let widget = this.#builder.get_object(`profile_${currentProfile}`);
        if (widget) {
            widget.set_active(true);
        }
    }

    /**
     * set values for all elements
     *
     * @param {string} profile profile name or null for get it from gsettings
     *
     * @returns {void}
     */
    #setValues(profile)
    {
        for (let [, key] of Object.entries(this.#prefsKeys.keys)) {

            let widget = this.#builder.get_object(key.widgetId);

            let value;

            switch (key.widgetType) {

                case 'GtkSwitch':
                    value
                    = (profile)
                    ? key.profiles[profile]
                    : this.#settings.get_boolean(key.name);

                    widget.set_active(value);
                    break;

                case 'AdwActionRow':
                    let index
                    = (profile)
                    ? key.profiles[profile]
                    : this.#settings.get_int(key.name);

                    for (let k in key.maps) {
                        if (key.maps[k] === index) {
                            index = k;
                            break;
                        }
                    }
                    widget.set_selected(index);
                    break;

                case 'AdwSpinRow':
                    value
                    = (profile)
                    ? key.profiles[profile]
                    : this.#settings.get_int(key.name);

                    widget.set_value(value);
                    break;
            }
        }
    }

    /**
     * apply all supported keys to the elements
     *
     * @returns {void}
     */
     #onlyShowSupportedRows()
     {
         for (let [, key] of Object.entries(this.#prefsKeys.keys)) {
            let row = this.#builder.get_object(`${key.id}_row`);
            let visible = key.supported;
            row.visible = visible;
        }
     }
};
