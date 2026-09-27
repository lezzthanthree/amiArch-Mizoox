import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const WorkspaceIndicator = GObject.registerClass(
class WorkspaceIndicator extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Workspace Indicator', true);

        this._settings = settings;
        this._onUpdate = this._update.bind(this);

        this._label = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
            style: 'font-weight: bold; padding: 0 4px;',
        });

        this.add_child(this._label);
        this._update();

        this.connect('button-press-event', (_actor, event) => {
            if (event.get_button() === 1) {
                Main.overview.toggle();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        this._wsSignal = global.workspace_manager.connect(
            'active-workspace-changed',
            this._onUpdate
        );
        this._wsCountSignal = global.workspace_manager.connect(
            'notify::n-workspaces',
            this._onUpdate
        );
        this._settingsSignal = this._settings.connect(
            'changed::show-total',
            this._onUpdate
        );
    }

    _update() {
        const manager = global.workspace_manager;
        const current = manager.get_active_workspace_index() + 1;

        if (this._settings.get_boolean('show-total')) {
            const total = manager.get_n_workspaces();
            this._label.set_text(`${current} / ${total}`);
        } else {
            this._label.set_text(`${current}`);
        }
    }

    destroy() {
        if (this._wsSignal) {
            global.workspace_manager.disconnect(this._wsSignal);
            this._wsSignal = null;
        }
        if (this._wsCountSignal) {
            global.workspace_manager.disconnect(this._wsCountSignal);
            this._wsCountSignal = null;
        }
        if (this._settingsSignal) {
            this._settings.disconnect(this._settingsSignal);
            this._settingsSignal = null;
        }
        super.destroy();
    }
});

export default class WorkspaceNumberExtension extends Extension {
    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.workspace-number-indicator');
        this._addIndicator();
        const onPositionChange = () => {
            this._removeIndicator();
            this._addIndicator();
        };
        this._positionSignal = this._settings.connect('changed::panel-position', onPositionChange);
        this._leftPlacementSignal = this._settings.connect('changed::left-placement', () => {
            if (this._settings.get_string('panel-position') === 'left')
                onPositionChange();
        });
    }

    _addIndicator() {
        const box = this._settings.get_string('panel-position');
        let index;
        if (box === 'left')
            index = this._settings.get_string('left-placement') === 'before' ? 0 : 1;
        else
            index = 0;
        this._indicator = new WorkspaceIndicator(this._settings);
        Main.panel.addToStatusArea('workspace-indicator', this._indicator, index, box);
    }

    _removeIndicator() {
        this._indicator?.destroy();
        this._indicator = null;
    }

    disable() {
        if (this._positionSignal) {
            this._settings.disconnect(this._positionSignal);
            this._positionSignal = null;
        }
        if (this._leftPlacementSignal) {
            this._settings.disconnect(this._leftPlacementSignal);
            this._leftPlacementSignal = null;
        }
        this._removeIndicator();
        this._settings = null;
    }
}
