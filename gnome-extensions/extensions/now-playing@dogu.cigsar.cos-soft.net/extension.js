/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Pango from 'gi://Pango';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const MPRIS_PREFIX = 'org.mpris.MediaPlayer2.';
const DBUS_NAME = 'org.freedesktop.DBus';
const DBUS_PATH = '/org/freedesktop/DBus';
const PLAYER_PATH = '/org/mpris/MediaPlayer2';
const PLAYER_INTERFACE = 'org.mpris.MediaPlayer2.Player';
const PANEL_TEXT_WIDTH = 180;
const MARQUEE_STEP = 1;
const MARQUEE_DELAY_MS = 35;
const MARQUEE_PAUSE_MS = 900;
const PROGRESS_UPDATE_DELAY_MS = 500;
const PANEL_POSITION_KEY = 'panel-position';
const SHOW_PANEL_TEXT_KEY = 'show-panel-text';
const PANEL_TEXT_WIDTH_KEY = 'panel-text-width';
const PANEL_TEXT_FORMAT_KEY = 'panel-text-format';
const ENABLE_MARQUEE_KEY = 'enable-marquee';
const PANEL_TEXT_FORMAT_PROGRESS_BAR = 'progress-bar';

function _variantToJS(value) {
    if (value && typeof value.deep_unpack === 'function')
        return value.deep_unpack();

    return value;
}

function _formatTrackInfo(metadata, fallbackTrack = null) {
    const hasKey = key => Object.prototype.hasOwnProperty.call(metadata ?? {}, key);

    if (!metadata)
        return fallbackTrack ?? {
            title: 'Nothing playing',
            artist: '',
            album: '',
        };

    const fallbackTitle = fallbackTrack?.title ?? 'Unknown title';
    const fallbackArtist = fallbackTrack?.artist ?? '';
    const fallbackAlbum = fallbackTrack?.album ?? '';
    const title = hasKey('xesam:title') ? _variantToJS(metadata['xesam:title']) : null;
    const url = hasKey('xesam:url') ? _variantToJS(metadata['xesam:url']) : null;
    const artists = hasKey('xesam:artist') ? _variantToJS(metadata['xesam:artist']) : null;
    const albumArtists = hasKey('xesam:albumArtist') ? _variantToJS(metadata['xesam:albumArtist']) : null;
    const album = hasKey('xesam:album') ? _variantToJS(metadata['xesam:album']) : null;
    const artistList = Array.isArray(artists) && artists.filter(Boolean).length ? artists : albumArtists;

    return {
        title: String(title ?? url ?? fallbackTitle),
        artist: Array.isArray(artistList) ? artistList.filter(Boolean).join(', ') : String(artistList ?? fallbackArtist),
        album: String(album ?? fallbackAlbum),
    };
}

function _pickStatusIcon(status) {
    switch (status) {
    case 'Playing':
        return 'media-playback-start-symbolic';
    case 'Paused':
        return 'media-playback-pause-symbolic';
    default:
        return 'media-playback-stop-symbolic';
    }
}

function _formatPlaybackTime(microseconds) {
    if (!(microseconds >= 0))
        return '--:--';

    const totalSeconds = Math.floor(microseconds / 1000000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0)
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const NowPlayingIndicator = GObject.registerClass(
class NowPlayingIndicator extends PanelMenu.Button {
    constructor(settings) {
        super(0.0, 'Now Playing', false);

        this._settings = settings;
        this._settingsChangedId = this._settings.connect('changed', () => this._applySettings());
        this._playerProxy = null;
        this._playerProxySignalId = 0;
        this._dbusSignalId = 0;
        this._menuOpenStateChangedId = 0;
        this._marqueeTimeoutId = 0;
        this._marqueeStartTimeoutId = 0;
        this._marqueeEndTimeoutId = 0;
        this._progressTimeoutId = 0;
        this._progressPosition = 0;
        this._progressLastUpdateUs = 0;
        this._progressSeekHoldUntilUs = 0;
        this._progressStoppedSinceUs = 0;
        this._marqueeOffset = 0;
        this._marqueeTextWidth = 0;
        this._panelTextWidth = PANEL_TEXT_WIDTH;
        this._panelTextFormat = 'artist-title';
        this._showPanelText = true;
        this._enableMarquee = true;
        this._currentPlayerName = null;
        this._trackInfo = {
            title: 'Nothing playing',
            artist: '',
            album: '',
        };

        this._icon = new St.Icon({
            icon_name: 'media-playback-stop-symbolic',
            style_class: 'system-status-icon',
        });
        this._panelBox = new St.BoxLayout({
            y_align: Clutter.ActorAlign.CENTER,
            reactive: true,
            style_class: 'now-playing-panel-box',
        });
        this._labelContainer = new St.BoxLayout({
            width: PANEL_TEXT_WIDTH,
            x_expand: false,
            y_expand: false,
            clip_to_allocation: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'now-playing-panel-label-container',
        });
        this._label = new St.Label({
            text: 'Nothing playing',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'now-playing-panel-label',
        });
        this._label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        this._label.clutter_text.line_wrap = false;
        this._label.x = 0;
        this._label.y = 0;
        this._progressContainer = new St.Widget({
            width: PANEL_TEXT_WIDTH,
            height: 6,
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            clip_to_allocation: true,
            style_class: 'now-playing-progress-container',
            style: 'background-color: rgba(255, 255, 255, 0.18); border-radius: 999px;',
        });
        this._progressBar = new St.Widget({
            height: 6,
            width: 0,
            x_expand: false,
            y_expand: false,
            x_align: Clutter.ActorAlign.START,
            style_class: 'now-playing-progress-bar',
            style: 'background-color: rgba(255, 255, 255, 0.9); border-radius: 999px;',
        });

        this._panelBox.connect('button-press-event', (_actor, event) => {
            if (event.get_button() !== Clutter.BUTTON_SECONDARY)
                return Clutter.EVENT_PROPAGATE;

            this._togglePanelTextVisibility();
            return Clutter.EVENT_STOP;
        });

        this._labelContainer.add_child(this._label);
    this._progressContainer.add_child(this._progressBar);
        this._panelBox.add_child(this._icon);
        this._panelBox.add_child(this._labelContainer);
    this._panelBox.add_child(this._progressContainer);
        this.add_child(this._panelBox);

        this._statusItem = this._createInfoRow('Status', 'Nothing playing');
        this._titleItem = this._createInfoRow('Title', '');
        this._artistItem = this._createInfoRow('Artist', '');
        this._albumItem = this._createInfoRow('Album', '');
        this._playerItem = this._createInfoRow('Player', '');
        this._timeItem = this._createInfoRow('Time', '');

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._previousItem = this._createActionRow('Previous', () => this._invokePlayerAction('Previous'));
        this._playPauseItem = this._createActionRow('Play / Pause', () => this._invokePlayerAction('PlayPause'));
        this._nextItem = this._createActionRow('Next', () => this._invokePlayerAction('Next'));

        this._menuOpenStateChangedId = this.menu.connect('open-state-changed', (_menu, isOpen) => {
            if (isOpen)
                this._refreshFromBus();
        });

        this._applySettings();

        this._dbusSignalId = Gio.DBus.session.signal_subscribe(
            DBUS_NAME,
            DBUS_NAME,
            'NameOwnerChanged',
            DBUS_PATH,
            null,
            Gio.DBusSignalFlags.NONE,
            () => this._refreshFromBus()
        );

        this._refreshFromBus();
    }

    destroy() {
        this._stopMarquee();
        this._stopProgressUpdates();

        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        if (this._dbusSignalId) {
            Gio.DBus.session.signal_unsubscribe(this._dbusSignalId);
            this._dbusSignalId = 0;
        }

        if (this._menuOpenStateChangedId) {
            this.menu.disconnect(this._menuOpenStateChangedId);
            this._menuOpenStateChangedId = 0;
        }

        this._detachPlayerProxy();
        super.destroy();
    }

    _applySettings() {
        this._panelTextWidth = this._settings.get_int(PANEL_TEXT_WIDTH_KEY);
        this._panelTextFormat = this._settings.get_string(PANEL_TEXT_FORMAT_KEY);
        this._showPanelText = this._settings.get_boolean(SHOW_PANEL_TEXT_KEY);
        this._enableMarquee = this._settings.get_boolean(ENABLE_MARQUEE_KEY);

        const showProgressBar = this._showPanelText && this._panelTextFormat === PANEL_TEXT_FORMAT_PROGRESS_BAR;
        this._labelContainer.visible = this._showPanelText && !showProgressBar;
        this._progressContainer.visible = showProgressBar;
        this._labelContainer.width = this._showPanelText ? this._panelTextWidth : 0;
        this._progressContainer.width = this._showPanelText ? this._panelTextWidth : 0;
        this._labelContainer.x_expand = this._showPanelText;
        this._label.clutter_text.ellipsize = this._enableMarquee ? Pango.EllipsizeMode.NONE : Pango.EllipsizeMode.END;

        this._updateFromPlayer();
    }

    _createInfoRow(label, value) {
        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            hover: false,
        });

        const row = new St.BoxLayout({
            x_expand: true,
            vertical: false,
            style_class: 'now-playing-row',
        });

        const titleLabel = new St.Label({
            text: `${label}:`,
            style_class: 'now-playing-row-label',
        });
        const valueLabel = new St.Label({
            text: value,
            x_expand: true,
            style_class: 'now-playing-row-value',
        });
        valueLabel.clutter_text.ellipsize = Pango.EllipsizeMode.END;

        row.add_child(titleLabel);
        row.add_child(valueLabel);
        item.add_child(row);
        this.menu.addMenuItem(item);

        return valueLabel;
    }

    _createActionRow(label, callback) {
        const item = new PopupMenu.PopupMenuItem(label);
        item.connect('activate', callback);
        this.menu.addMenuItem(item);
        return item;
    }

    _getPlayerNames() {
        try {
            const result = Gio.DBus.session.call_sync(
                DBUS_NAME,
                DBUS_PATH,
                DBUS_NAME,
                'ListNames',
                null,
                new GLib.VariantType('(as)'),
                Gio.DBusCallFlags.NONE,
                -1,
                null
            );

            return result.deep_unpack()[0].filter(name => name.startsWith(MPRIS_PREFIX));
        } catch (error) {
            return [];
        }
    }

    _createPlayerProxy(name) {
        try {
            return Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SESSION,
                Gio.DBusProxyFlags.NONE,
                null,
                name,
                PLAYER_PATH,
                PLAYER_INTERFACE,
                null
            );
        } catch (error) {
            return null;
        }
    }

    _getPlaybackStatus(name) {
        const proxy = this._createPlayerProxy(name);
        if (!proxy)
            return null;

        const status = proxy.get_cached_property('PlaybackStatus');
        return status ? String(status.deep_unpack()) : null;
    }

    _pickPlayerName(names) {
        if (!names.length)
            return null;

        const activeName = names.find(name => this._getPlaybackStatus(name) === 'Playing');
        if (activeName)
            return activeName;

        if (this._currentPlayerName && names.includes(this._currentPlayerName))
            return this._currentPlayerName;

        const pausedName = names.find(name => this._getPlaybackStatus(name) === 'Paused');
        if (pausedName)
            return pausedName;

        return names[0];
    }

    _detachPlayerProxy() {
        if (this._playerProxy && this._playerProxySignalId) {
            this._playerProxy.disconnect(this._playerProxySignalId);
            this._playerProxySignalId = 0;
        }

        if (this._playerProxy && this._playerProxySeekedSignalId) {
            this._playerProxy.disconnect(this._playerProxySeekedSignalId);
            this._playerProxySeekedSignalId = 0;
        }

        this._playerProxy = null;
        this._currentPlayerName = null;
        this._progressStoppedSinceUs = 0;
    }

    _stopMarquee() {
        if (this._marqueeTimeoutId) {
            GLib.source_remove(this._marqueeTimeoutId);
            this._marqueeTimeoutId = 0;
        }

        if (this._marqueeStartTimeoutId) {
            GLib.source_remove(this._marqueeStartTimeoutId);
            this._marqueeStartTimeoutId = 0;
        }

        if (this._marqueeEndTimeoutId) {
            GLib.source_remove(this._marqueeEndTimeoutId);
            this._marqueeEndTimeoutId = 0;
        }

        this._marqueeOffset = 0;
        this._marqueeTextWidth = 0;
        this._label.translation_x = 0;
    }

    _stopProgressUpdates() {
        if (this._progressTimeoutId) {
            GLib.source_remove(this._progressTimeoutId);
            this._progressTimeoutId = 0;
        }

        this._progressBar.width = 0;
        this._progressStoppedSinceUs = 0;
    }

    _restartProgressUpdates() {
        if (this._progressTimeoutId) {
            GLib.source_remove(this._progressTimeoutId);
            this._progressTimeoutId = 0;
        }

        this._progressLastUpdateUs = GLib.get_monotonic_time();
        // Compute the bar immediately so it doesn't flash to zero while
        // waiting for the first periodic tick (e.g. right after a skip
        // or scrub, when g-properties-changed triggers a restart).
        this._updateProgressBar();

        this._progressTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, PROGRESS_UPDATE_DELAY_MS, () => {
            this._updateProgressBar();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _restartMarquee() {
        this._stopMarquee();
        if (!this._showPanelText || !this._enableMarquee)
            return;

        const [, naturalWidth] = this._label.get_preferred_width(-1);
        this._marqueeTextWidth = naturalWidth;

        if (naturalWidth <= this._panelTextWidth) {
            this._label.translation_x = 0;
            return;
        }

        this._marqueeStartTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MARQUEE_PAUSE_MS, () => {
            this._marqueeStartTimeoutId = 0;
            this._marqueeTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MARQUEE_DELAY_MS, () => {
                this._marqueeOffset += MARQUEE_STEP;
                const maxOffset = Math.max(0, this._marqueeTextWidth - this._panelTextWidth);

                if (this._marqueeOffset >= maxOffset) {
                    this._marqueeOffset = maxOffset;
                    this._label.translation_x = -this._marqueeOffset;

                    if (this._marqueeTimeoutId) {
                        GLib.source_remove(this._marqueeTimeoutId);
                        this._marqueeTimeoutId = 0;
                    }

                    this._marqueeEndTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MARQUEE_PAUSE_MS, () => {
                        this._marqueeEndTimeoutId = 0;
                        this._label.translation_x = 0;
                        this._marqueeOffset = 0;
                        this._restartMarquee();
                        return GLib.SOURCE_REMOVE;
                    });
                    return GLib.SOURCE_REMOVE;
                }

                this._label.translation_x = -this._marqueeOffset;
                return GLib.SOURCE_CONTINUE;
            });

            return GLib.SOURCE_REMOVE;
        });
    }

    _attachPlayerProxy(name) {
        if (name === this._currentPlayerName && this._playerProxy)
            return;

        this._detachPlayerProxy();

        if (!name) {
            this._renderNoPlayer();
            return;
        }

        const proxy = this._createPlayerProxy(name);
        if (!proxy) {
            this._renderNoPlayer();
            return;
        }

        this._playerProxy = proxy;
        this._currentPlayerName = name;
        this._playerProxySignalId = this._playerProxy.connect('g-properties-changed', () => {
            this._updateFromPlayer();
        });
        this._playerProxySeekedSignalId = this._playerProxy.connect('g-signal', (_proxy, _senderName, signalName, parameters) => {
            if (signalName !== 'Seeked')
                return;

            this._progressPosition = Number(parameters.deep_unpack()[0] ?? 0);
            this._progressLastUpdateUs = GLib.get_monotonic_time();
            this._progressSeekHoldUntilUs = this._progressLastUpdateUs + 2000000;
            this._progressStoppedSinceUs = 0;
            this._updateProgressBar();
        });

        this._updateFromPlayer();
    }

    _refreshFromBus() {
        const names = this._getPlayerNames();
        const playerName = this._pickPlayerName(names);
        this._attachPlayerProxy(playerName);
    }

    _setInfoRow(label, value) {
        label.text = value;
    }

    _setActionsEnabled(canControl, canGoPrevious, canGoNext) {
        this._previousItem.setSensitive(Boolean(canControl && canGoPrevious));
        this._playPauseItem.setSensitive(Boolean(canControl));
        this._nextItem.setSensitive(Boolean(canControl && canGoNext));
    }

    _togglePanelTextVisibility() {
        this._settings.set_boolean(SHOW_PANEL_TEXT_KEY, !this._showPanelText);
    }

    _renderNoPlayer() {
        this._icon.icon_name = _pickStatusIcon('Stopped');
        this._label.text = 'Nothing playing';
        this._trackInfo = {
            title: 'Nothing playing',
            artist: '',
            album: '',
        };
        this._progressStoppedSinceUs = 0;

        this._setInfoRow(this._statusItem, 'Nothing playing');
        this._setInfoRow(this._titleItem, '');
        this._setInfoRow(this._artistItem, '');
        this._setInfoRow(this._albumItem, '');
        this._setInfoRow(this._playerItem, '');
        this._setInfoRow(this._timeItem, '');
        this._setActionsEnabled(false, false, false);
        this._stopProgressUpdates();
    }

    _buildPanelText(track) {
        const fallbackText = 'Now Playing';

        if (!track)
            return fallbackText;

        switch (this._panelTextFormat) {
        case 'title':
            return track.title || fallbackText;
        case 'artist':
            return track.artist || track.title || fallbackText;
        case 'title-artist':
            return [track.title, track.artist].filter(Boolean).join(' - ') || fallbackText;
        case 'artist-title':
        default:
            return [track.artist, track.title].filter(Boolean).join(' - ') || fallbackText;
        }
    }

    _updateProgressBar() {
        if (!this._playerProxy) {
            this._progressBar.width = 0;
            this._setInfoRow(this._timeItem, '');
            return;
        }

        const metadataVariant = this._playerProxy.get_cached_property('Metadata');
        const metadata = metadataVariant ? metadataVariant.deep_unpack() : null;
        const duration = metadata && Object.prototype.hasOwnProperty.call(metadata, 'mpris:length')
            ? Number(_variantToJS(metadata['mpris:length']))
            : 0;

        const statusVariant = this._playerProxy.get_cached_property('PlaybackStatus');
        const status = statusVariant ? String(statusVariant.deep_unpack()) : 'Stopped';
        const currentPosition = this._getPlaybackPosition();
        const nowUs = GLib.get_monotonic_time();
        const seekHoldActive = nowUs < this._progressSeekHoldUntilUs;

        if (status === 'Playing') {
            if (seekHoldActive && currentPosition > 0)
                this._progressPosition = currentPosition;
            else if (this._progressLastUpdateUs > 0)
                this._progressPosition += nowUs - this._progressLastUpdateUs;
        } else if (currentPosition > 0) {
            this._progressPosition = currentPosition;
        } else if (status === 'Stopped' && !seekHoldActive) {
            if (!this._progressStoppedSinceUs)
                this._progressStoppedSinceUs = nowUs;

            if (nowUs - this._progressStoppedSinceUs > 1500000)
                this._progressPosition = 0;
        } else {
            this._progressStoppedSinceUs = 0;
        }

        this._progressLastUpdateUs = nowUs;

        const timeText = duration > 0
            ? `${_formatPlaybackTime(this._progressPosition)} / ${_formatPlaybackTime(duration)}`
            : `${_formatPlaybackTime(this._progressPosition)} / --:--`;

        this._setInfoRow(this._timeItem, timeText);

        if (this._progressContainer.visible && duration > 0) {
            const ratio = Math.max(0, Math.min(1, this._progressPosition / duration));
            const barWidth = Math.max(0, Math.round(this._panelTextWidth * ratio));
            this._progressBar.width = barWidth;
        } else {
            this._progressBar.width = 0;
        }
    }

    _getPlaybackPosition() {
        if (!this._currentPlayerName)
            return 0;

        try {
            const result = Gio.DBus.session.call_sync(
                this._currentPlayerName,
                PLAYER_PATH,
                'org.freedesktop.DBus.Properties',
                'Get',
                new GLib.Variant('(ss)', [PLAYER_INTERFACE, 'Position']),
                new GLib.VariantType('(v)'),
                Gio.DBusCallFlags.NONE,
                -1,
                null
            );

            const variant = result.deep_unpack()[0];
            return Number(_variantToJS(variant));
        } catch (error) {
            return 0;
        }
    }

    _updateFromPlayer() {
        if (!this._playerProxy) {
            this._renderNoPlayer();
            return;
        }

        const metadataVariant = this._playerProxy.get_cached_property('Metadata');
        const metadata = metadataVariant ? metadataVariant.deep_unpack() : null;
        const statusVariant = this._playerProxy.get_cached_property('PlaybackStatus');
        const status = statusVariant ? String(statusVariant.deep_unpack()) : 'Stopped';
        const canControlVariant = this._playerProxy.get_cached_property('CanControl');
        const canGoPreviousVariant = this._playerProxy.get_cached_property('CanGoPrevious');
        const canGoNextVariant = this._playerProxy.get_cached_property('CanGoNext');

        const canControl = Boolean(canControlVariant && canControlVariant.deep_unpack());
        const canGoPrevious = Boolean(canGoPreviousVariant && canGoPreviousVariant.deep_unpack());
        const canGoNext = Boolean(canGoNextVariant && canGoNextVariant.deep_unpack());
        this._trackInfo = _formatTrackInfo(metadata, this._trackInfo);
        const track = this._trackInfo;
        const panelText = this._showPanelText ? this._buildPanelText(track) : '';
        const playerLabel = this._currentPlayerName ? this._currentPlayerName.replace(MPRIS_PREFIX, '') : '';

        this._icon.icon_name = _pickStatusIcon(status);
        this._label.text = panelText;

        if (this._showPanelText && this._panelTextFormat !== PANEL_TEXT_FORMAT_PROGRESS_BAR)
            this._restartMarquee();
        else
            this._stopMarquee();

        this._restartProgressUpdates();

        this._setInfoRow(this._statusItem, status);
        this._setInfoRow(this._titleItem, track.title);
        this._setInfoRow(this._artistItem, track.artist);
        this._setInfoRow(this._albumItem, track.album);
        this._setInfoRow(this._playerItem, playerLabel);
        this._setActionsEnabled(canControl, canGoPrevious, canGoNext);
    }

    _invokePlayerAction(action) {
        if (!this._playerProxy)
            return;

        try {
            this._playerProxy.call_sync(
                action,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null
            );
        } catch (error) {
            this._refreshFromBus();
        }
    }
});

export default class NowPlayingExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settingsChangedId = this._settings.connect('changed', () => this._rebuildIndicator());
        this._rebuildIndicator();
    }

    disable() {
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    _rebuildIndicator() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        const panelPosition = this._settings.get_string(PANEL_POSITION_KEY);
        const panelIndex = panelPosition === 'right' ? 0 : -1;
        this._indicator = new NowPlayingIndicator(this._settings);
        Main.panel.addToStatusArea('now-playing', this._indicator, panelIndex, panelPosition);
    }
}