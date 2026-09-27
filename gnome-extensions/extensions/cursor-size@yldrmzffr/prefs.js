import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const MIN_CURSOR_SIZE = 16;
const MAX_CURSOR_SIZE = 128;
const STEP_INCREMENT = 2;

export default class CursorSizePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const _ = this.gettext.bind(this);

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _('Cursor Size Settings'),
            description: _('Customize the size of your mouse cursor')
        });
        page.add(group);

        const sliderRow = new Adw.ActionRow({
            title: _('Cursor Size'),
            subtitle: _('Current size: %d px').format(settings.get_int('cursor-size'))
        });
        group.add(sliderRow);

        const controlBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            valign: Gtk.Align.CENTER,
        });

        const adjustment = new Gtk.Adjustment({
            lower: MIN_CURSOR_SIZE,
            upper: MAX_CURSOR_SIZE,
            step_increment: STEP_INCREMENT,
            page_increment: 8,
            page_size: 0,
            value: settings.get_int('cursor-size')
        });

        const slider = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: adjustment,
            draw_value: false,
            hexpand: true,
            width_request: 200,
            valign: Gtk.Align.CENTER,
        });

        slider.add_mark(24, Gtk.PositionType.BOTTOM, null);
        slider.add_mark(48, Gtk.PositionType.BOTTOM, null);
        slider.add_mark(64, Gtk.PositionType.BOTTOM, null);

        const spinButton = new Gtk.SpinButton({
            adjustment: adjustment,
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
        });

        adjustment.connect('value-changed', (adj) => {
            const value = Math.round(adj.get_value());
            sliderRow.subtitle = _('Current size: %d px').format(value);
        });

        settings.bind('cursor-size', adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);

        controlBox.append(slider);
        controlBox.append(spinButton);
        sliderRow.add_suffix(controlBox);

        window.add(page);
    }
}
