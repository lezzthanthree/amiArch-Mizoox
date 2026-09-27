/**
 * Support Notifier Library
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2026
 * @license    GPL-3.0-only
 */

const TYPE = {
    NEVER: 0,
    NEW_RELEASE: 1,
};

/**
 * Support Notifier
 */
export class SupportNotifier
{
    /**
     * Current shell version
     *
     * @type {number|null}
     */
    #shellVersion = null;

    /**
     * Current extension version
     *
     * @type {number|null}
     */
    #extensionVersion = null;

    /**
     * Instance of Gio.Settings
     *
     * @type {Gio.Settings|null}
     */
    #settings = null;

    /**
     * Instance of current Extension
     *
     * @type {Extension|null}
     */
    #extension = null;

    /**
     * Class Constructor
     *
     * @param {Object} dependencies
     *   'MessageTray' reference to ui::messageTray
     *   'Main' reference to ui::main
     *   'GLib' reference to GLib
     *   'Gio' reference to Gio
     * @param {number} shellVersion - float in major.minor format
     * @param {number} extensionVersion - integer
     * @param {Object} extension
     */
    constructor(dependencies, shellVersion, extensionVersion, extension)
    {
        this._messageTray = dependencies['MessageTray'] || null;
        this._main = dependencies['Main'] || null;
        this._glib = dependencies['GLib'] || null;
        this._gio = dependencies['Gio'] || null;
        this.#settings = dependencies['Settings'] || null;

        this.#shellVersion = shellVersion;
        this.#extensionVersion = extensionVersion;
        this.#extension = extension;
    }

    /**
     * register all signals for settings
     *
     * @returns {void}
     */
    #registerSettingsSignals()
    {
        this.#settings.connectObject(
            'changed::support-notifier-type',
            () => {
                this.restart();
            },
            this
        );
    }

    /**
     * unregister all signals from settings
     *
     * @returns {void}
     */
    #unregisterSettingsSignals()
    {
        this.#settings.disconnectObject(this);
    }

    /**
     * start support notifier service
     *
     * @returns {void}
     */
    start()
    {
        if (!this.#isAllowedForCurrentVersion()) {
            return;
        }

        this.#registerSettingsSignals();

        let type = this.#settings.get_int('support-notifier-type');

        if (type === TYPE.NEW_RELEASE) {
            if (!this.#isShownForCurrentVersion()) {
                if (this._timeoutId) {
                    this._glib.source_remove(this._timeoutId);
                    this._timeoutId = null;
                }
                this._timeoutId = this._glib.timeout_add_seconds(
                    this._glib.PRIORITY_LOW,
                    300,
                    () => {
                        if (this.#isInFullscreen()) {
                            return this._glib.SOURCE_CONTINUE;
                        }
                        this.#showNotification();
                        this._timeoutId = null;
                        return this._glib.SOURCE_REMOVE;
                    }
                );
            }
        }
    }

    /**
     * stop support notifier service
     *
     * @returns {void}
     */
    stop()
    {
        if (this._timeoutId) {
            this._glib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }

        this.#unregisterSettingsSignals();
    }

    /**
     * restart support notifier service
     *
     * @returns {void}
     */
    restart()
    {
        this.stop();
        this.start();
    }

    /**
     * checks whether the notification can be shown for the current version.
     *
     * we are going to only show the notification for specific versions,
     * for example, every 'n' versions.
     *
     * @returns {boolean}
     */
    #isAllowedForCurrentVersion()
    {
        return this.#extensionVersion % 3 === 0;
    }

    /**
     * whether the notification showed for the current extension version
     *
     * @returns {boolean}
     */
    #isShownForCurrentVersion()
    {
        let showedVersion = this.#settings.get_int('support-notifier-showed-version');

        return this.#extensionVersion <= showedVersion;
    }

    /**
     * check whether any app is in fullscreen
     *
     * @returns {boolean}
     */
    #isInFullscreen()
    {
        return this._main.layoutManager.primaryMonitor?.inFullscreen ?? false;
    }

    /**
     * show notification
     *
     * @returns {void}
     */
    #showNotification()
    {
        let title = `Just Perfection Extension Updated To Version ${this.#extensionVersion}`;
        let body = "The future of the Just Perfection extension depends on your support! " +
            "Your donation will help add new features and updates. " +
            "Please consider making a donation." +
            "\r\r" +
            "<i>Crypto donations are preferred since there are no platform fees, " +
            "and 100% of your donation is received directly.</i>";

        const source = this.#getSource();
        const notification = this.#getNotification(source, title, body);

        notification.addAction('Buy Me a Coffee', () => {
            this._gio.AppInfo.launch_default_for_uri('https://www.buymeacoffee.com/justperfection', null);
            notification.destroy();
        });

        notification.addAction('Donate Crypto', () => {
            this.#extension.openPreferences();
            notification.destroy();
        });

        notification.addAction("Don't show again!", () => {
            this.#settings.set_int('support-notifier-type', TYPE.NEVER);
            notification.destroy();
        });

        if (this.#shellVersion >= 46) {
            source.addNotification(notification);
        } else {
            source.showNotification(notification);
        }

        this.#settings.set_int('support-notifier-showed-version', this.#extensionVersion);
    }

    /**
     * get system notification source
     *
     * @returns {MessageTray.Source}
     */
    #getSource()
    {
        const source
            = (this.#shellVersion >= 46)
            ? this._messageTray.getSystemSource()
            : new this._messageTray.SystemNotificationSource();

        if (this.#shellVersion < 46) {
            this._main.messageTray.add(source);
        }

        source.title = 'Just Perfection Extension';
        source.iconName = 'application-x-addon-symbolic';

        return source;
    }

    /**
     * get notification
     *
     * @param {MessageTray.Source} source
     * @param {string} title
     * @param {string} body
     *
     * @returns {MessageTray.Notification}
     */
    #getNotification(source, title, body)
    {
        const notification
            = (this.#shellVersion >= 46)
            ? new this._messageTray.Notification({source, title, body})
            : new this._messageTray.Notification(source, title, body, {bannerMarkup: true});

        notification.useBodyMarkup = true;
        notification.resident = true;
        notification.iconName = 'emblem-favorite-symbolic';
        notification.urgency = this._messageTray.Urgency.HIGH;

        return notification;
    }
}
