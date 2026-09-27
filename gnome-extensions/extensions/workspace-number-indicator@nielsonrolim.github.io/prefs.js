import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WorkspaceIndicatorPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.workspace-number-indicator');

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Display',
            description: 'Configure what is shown in the panel indicator.',
        });
        page.add(group);

        const row = new Adw.SwitchRow({
            title: 'Show total number of workspaces',
            subtitle: 'Displays as "current / total" (e.g. 2 / 4) instead of just the number',
        });
        group.add(row);

        settings.bind('show-total', row, 'active', Gio.SettingsBindFlags.DEFAULT);

        const positions = ['left', 'right'];
        const positionModel = new Gtk.StringList({ strings: ['Left', 'Right'] });

        const posRow = new Adw.ComboRow({
            title: 'Panel position',
            subtitle: 'Where to place the indicator in the top bar',
            model: positionModel,
        });
        posRow.selected = positions.indexOf(settings.get_string('panel-position'));
        posRow.connect('notify::selected', () => {
            settings.set_string('panel-position', positions[posRow.selected]);
        });
        settings.connect('changed::panel-position', () => {
            posRow.selected = positions.indexOf(settings.get_string('panel-position'));
        });
        group.add(posRow);

        const placements = ['before', 'after'];
        const placementModel = new Gtk.StringList({ strings: ['Before Activities button', 'After Activities button'] });

        const leftPlacementRow = new Adw.ComboRow({
            title: 'Left side placement',
            subtitle: 'Position relative to the Activities button',
            model: placementModel,
        });
        leftPlacementRow.selected = placements.indexOf(settings.get_string('left-placement'));
        leftPlacementRow.connect('notify::selected', () => {
            settings.set_string('left-placement', placements[leftPlacementRow.selected]);
        });
        settings.connect('changed::left-placement', () => {
            leftPlacementRow.selected = placements.indexOf(settings.get_string('left-placement'));
        });

        const updateSensitivity = () => {
            leftPlacementRow.sensitive = settings.get_string('panel-position') === 'left';
        };
        updateSensitivity();
        settings.connect('changed::panel-position', updateSensitivity);

        group.add(leftPlacementRow);
    }
}
