/**
 * PrefsKeys Library
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2026
 * @license    GPL-3.0-only
 */

/**
 * prefs keys
 */
export class PrefsKeys
{
    /**
     * Current shell version
     *
     * @type {number|null}
     */
    #shellVersion = null;

    /**
     * @typedef {Object} Profiles
     * @property {boolean} default
     * @property {boolean} minimal
     * @property {boolean} superminimal
     */

    /**
     * @typedef {Object} PrefsKey
     * @property {string} widgetType
     * @property {string} name
     * @property {string} id - name with _ instead of -
     * @property {string} widgetId - ie. ab_c_row for AdwActionRow named ab-c
     * @property {boolean} supported
     * @property {Profiles} profiles
     * @property {Object<string, *>} maps - Mapping configuration
     */

    /**
     * all available keys
     *
     * @type {Object<string, PrefsKey>}
     */
    keys = {};

    /**
     * class constructor
     *
     * @param {number} shellVersion - float in major.minor format
     */
    constructor(shellVersion)
    {
        this.#shellVersion = shellVersion;

        this.#setDefaults();
    }

    /**
     * set all default keys
     *
     * @returns {void}
     */
    #setDefaults()
    {
        this.#setKey(
            'panel',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'panel-in-overview',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'activities-button',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'clock-menu',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'keyboard-layout',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'accessibility-menu',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings-dark-mode',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings-night-light',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings-do-not-disturb',
            'GtkSwitch',
            (this.#shellVersion >= 49),
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings-backlight',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'quick-settings-airplane-mode',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'screen-sharing-indicator',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'screen-recording-indicator',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'search',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'dash',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'dash-separator',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'dash-app-running',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'osd',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'workspace-popup',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'workspace',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'background-menu',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'show-apps-button',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: true,
            }
        );

        this.#setKey(
            'workspaces-in-app-grid',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'window-preview-caption',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'window-preview-close-button',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'ripple-box',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'world-clock',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'weather',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'calendar',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'events-button',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'window-menu',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'window-menu-take-screenshot-button',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'panel-notification-icon',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'power-icon',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'window-picker-icon',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'type-to-search',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'window-demands-attention-focus',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'window-maximized-on-create',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'workspace-switcher-should-show',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'startup-status',
            'AdwActionRow',
            true,
            {
                default: 1,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'workspace-wrap-around',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'workspace-peek',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'workspace-thumbnail-to-main-view',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'overlay-key',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'double-super-to-appgrid',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: false,
            }
        );

        this.#setKey(
            'switcher-popup-delay',
            'GtkSwitch',
            true,
            {
                default: true,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'accent-color-icon',
            'GtkSwitch',
            (this.#shellVersion >= 47),
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'controls-manager-spacing-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 22,
            }
        );

        this.#setKey(
            'workspace-background-corner-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 15,
            }
        );

        this.#setKey(
            'top-panel-position',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'clock-menu-position',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'clock-menu-position-offset',
            'AdwSpinRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'workspace-switcher-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'animation',
            'AdwActionRow',
            true,
            {
                default: 1,
                minimal: 1,
                superminimal: 1,
            }
        );

        this.#setKey(
            'dash-icon-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 1,
                superminimal: 0,
            },
            {
                '1': 16,
                '2': 22,
                '3': 24,
                '4': 32,
                '5': 40,
                '6': 48,
                '7': 56,
                '8': 64,
            }
        );

        this.#setKey(
            'notification-banner-position',
            'AdwActionRow',
            true,
            {
                default: 1,
                minimal: 1,
                superminimal: 1,
            }
        );

        this.#setKey(
            'panel-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'panel-button-padding-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'panel-indicator-padding-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'panel-icon-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'osd-position',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'looking-glass-width',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'looking-glass-height',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'alt-tab-window-preview-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            },
            {
                '0': 0,
                '1': 32,
                '2': 64,
                '3': 128,
                '4': 256,
                '5': 512,
            }
        );

        this.#setKey(
            'alt-tab-small-icon-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            },
            {
                '0': 0,
                '1': 32,
                '2': 64,
                '3': 128,
                '4': 256,
                '5': 512,
            }
        );

        this.#setKey(
            'alt-tab-icon-size',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            },
            {
                '0': 0,
                '1': 32,
                '2': 64,
                '3': 128,
                '4': 256,
                '5': 512,
            }
        );

        this.#setKey(
            'max-displayed-search-results',
            'AdwActionRow',
            true,
            {
                default: 0,
                minimal: 0,
                superminimal: 0,
            }
        );

        this.#setKey(
            'invert-calendar-column-items',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: false,
                superminimal: false,
            }
        );

        this.#setKey(
            'theme',
            'GtkSwitch',
            true,
            {
                default: false,
                minimal: true,
                superminimal: true,
            }
        );

        this.#setKey(
            'support-notifier-type',
            'AdwActionRow'
        );
    }

    /**
     * set key
     *
     * @param {string} name should be the same as gsettings key name
     * @param {string} widgetType gtk widget type like 'GtkSwitch'.
     * @param {boolean} supported whether supported in the current shell
     * @param {Object} profiles values for each profile. for example:
     *   {default: true, minimal: false}
     * @param {Object} [maps] for example for combobox you can specify
     *  if the index is 1 use 32 as value:
     *  {1 : 32}
     *
     * @returns {void}
     */
    #setKey(name, widgetType, supported = true, profiles = {}, maps = {})
    {
        let id = name.replace(/-/g, '_');
        let widgetName = widgetType.toLowerCase().replace('gtk', '');

        let widgetId
        = (widgetType === 'AdwActionRow' || widgetType === 'AdwSpinRow')
        ?  `${id}_row`
        : `${id}_${widgetName}`;

        this.keys[id] = {
            widgetType,
            name,
            id,
            widgetId,
            supported,
            profiles,
            maps,
        };
    }
};
