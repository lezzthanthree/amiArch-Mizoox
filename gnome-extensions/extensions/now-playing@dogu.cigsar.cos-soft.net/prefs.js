import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PANEL_POSITION_KEY = 'panel-position';
const SHOW_PANEL_TEXT_KEY = 'show-panel-text';
const PANEL_TEXT_WIDTH_KEY = 'panel-text-width';
const PANEL_TEXT_FORMAT_KEY = 'panel-text-format';
const ENABLE_MARQUEE_KEY = 'enable-marquee';
const GITHUB_URL = 'https://github.com/dogucigsar/gnome-shell-extension-now-playing';
const GITHUB_PROFILE_URL = 'https://github.com/dogucigsar';

function _bindSwitchRow(settings, key, title, subtitle = null) {
    const row = new Adw.ActionRow({
        title,
        subtitle,
    });
    const toggle = new Gtk.Switch({
        active: settings.get_boolean(key),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
    row.add_suffix(toggle);
    row.activatable_widget = toggle;

    return row;
}

function _bindSpinRow(settings, key, title, subtitle, minValue, maxValue, stepIncrement) {
    const row = new Adw.ActionRow({
        title,
        subtitle,
    });
    const adjustment = new Gtk.Adjustment({
        lower: minValue,
        upper: maxValue,
        step_increment: stepIncrement,
        page_increment: stepIncrement * 5,
        value: settings.get_int(key),
    });
    const spinButton = new Gtk.SpinButton({
        adjustment,
        valign: Gtk.Align.CENTER,
        numeric: true,
    });

    settings.bind(key, adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    row.add_suffix(spinButton);
    row.activatable_widget = spinButton;

    return row;
}

function _bindComboRow(settings, key, title, subtitle, choices) {
    const row = new Adw.ComboRow({
        title,
        subtitle,
    });
    const model = new Gtk.StringList();

    for (const choice of choices)
        model.append(choice.label);

    row.model = model;

    const syncFromSettings = () => {
        const currentValue = settings.get_string(key);
        const selectedIndex = choices.findIndex(choice => choice.value === currentValue);
        row.selected = selectedIndex >= 0 ? selectedIndex : 0;
    };

    row.connect('notify::selected', () => {
        const choice = choices[row.selected];
        if (choice)
            settings.set_string(key, choice.value);
    });

    settings.connect(`changed::${key}`, syncFromSettings);
    syncFromSettings();

    return row;
}

export default class NowPlayingPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const layoutGroup = new Adw.PreferencesGroup({
            title: 'Panel layout',
        });
        layoutGroup.add(_bindComboRow(settings, PANEL_POSITION_KEY, 'Position', 'Choose where the indicator appears in the top bar.', [
            {label: 'Right', value: 'right'},
            {label: 'Center', value: 'center'},
            {label: 'Left', value: 'left'},
        ]));
        layoutGroup.add(_bindSwitchRow(settings, SHOW_PANEL_TEXT_KEY, 'Show text', 'Hide the track text and keep the icon only. You can also right-click the panel indicator to toggle it quickly.'));
        layoutGroup.add(_bindSpinRow(settings, PANEL_TEXT_WIDTH_KEY, 'Text width', 'Maximum width for the panel text before marquee scrolling kicks in.', 80, 400, 10));

        const textGroup = new Adw.PreferencesGroup({
            title: 'Text format',
        });
        textGroup.add(_bindComboRow(settings, PANEL_TEXT_FORMAT_KEY, 'Display order', 'Pick how the track text is composed in the panel.', [
            {label: 'Artist - Title', value: 'artist-title'},
            {label: 'Title - Artist', value: 'title-artist'},
            {label: 'Title only', value: 'title'},
            {label: 'Artist only', value: 'artist'},
            {label: 'Progress bar', value: 'progress-bar'},
        ]));
        textGroup.add(_bindSwitchRow(settings, ENABLE_MARQUEE_KEY, 'Enable marquee', 'Scroll long track text instead of truncating it.'));

        const aboutGroup = new Adw.PreferencesGroup({
            title: 'About',
        });
        const attributionRow = new Adw.ActionRow({
            title: 'Developed by Dogu Cigsar',
            subtitle: 'GitHub profile',
        });
        const githubButton = new Gtk.LinkButton({
            label: 'Open GitHub',
            uri: GITHUB_PROFILE_URL,
            valign: Gtk.Align.CENTER,
        });
        const repoRow = new Adw.ActionRow({
            title: 'Now Playing Extension',
            subtitle: 'GitHub repository',
        });
        const repoButton = new Gtk.LinkButton({
            label: 'Open Repository',
            uri: GITHUB_URL,
            valign: Gtk.Align.CENTER,
        });
        repoRow.add_suffix(repoButton);
        repoRow.activatable_widget = repoButton;
        aboutGroup.add(repoRow);
        attributionRow.add_suffix(githubButton);
        attributionRow.activatable_widget = githubButton;
        aboutGroup.add(attributionRow);

        page.add(layoutGroup);
        page.add(textGroup);
        page.add(aboutGroup);
        window.add(page);
    }
}