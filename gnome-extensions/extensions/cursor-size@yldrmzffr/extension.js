import Gio from 'gi://Gio';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class CursorSizeExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settings = null;
        this._interfaceSettings = null;
        this._cursorSizeChangedId = null;
        this._originalCursorSize = -1;
    }

    enable() {
        this._settings = this.getSettings();
        this._interfaceSettings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });

        this._originalCursorSize = this._interfaceSettings.get_int('cursor-size');

        // Don't change cursor size on first install
        const extensionCursorSize = this._settings.get_int('cursor-size');
        const defaultCursorSize = 24;

        if (extensionCursorSize === defaultCursorSize && this._originalCursorSize !== defaultCursorSize) {
            this._settings.set_int('cursor-size', this._originalCursorSize);
        }

        this._cursorSizeChangedId = this._settings.connect('changed::cursor-size', () => {
            this._setCursorSize(this._settings.get_int('cursor-size'));
        });

        this._setCursorSize(this._settings.get_int('cursor-size'));
        console.debug(`[${this.uuid}] enabled`);
    }

    disable() {
        if (this._originalCursorSize !== -1) {
            this._setCursorSize(this._originalCursorSize);
        }

        if (this._cursorSizeChangedId) {
            this._settings.disconnect(this._cursorSizeChangedId);
            this._cursorSizeChangedId = null;
        }

        this._settings = null;
        this._interfaceSettings = null;
        console.debug(`[${this.uuid}] disabled`);
    }

    _setCursorSize(size) {
        if (this._interfaceSettings && size >= 16 && size <= 128) {
            this._interfaceSettings.set_int('cursor-size', size);
        }
    }
}

