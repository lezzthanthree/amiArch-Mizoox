# Workspace Number Indicator

![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-45--50-blue)
![License](https://img.shields.io/badge/license-GPL--2.0-green)

A GNOME Shell extension that displays the current workspace number in the top panel. Supports showing just the current workspace (`2`) or current/total (`2 / 4`), and lets you place the indicator on the left or right side of the panel. Compatible with GNOME Shell 45–50.

<!-- Add screenshot here -->

## Features

- Displays current workspace number in the top panel
- Optional `current / total` format (e.g. `2 / 4`) or just the current number (e.g. `2`)
- Configurable panel position: left or right
- When placed on the left, choose before or after the Activities button
- Left-click the indicator to toggle the Overview

## Installation

### GNOME Extensions website

Install from [extensions.gnome.org](https://extensions.gnome.org) *(link coming soon)*.

### Manual install

```bash
git clone https://github.com/nielsonrolim/workspace-number-indicator.git \
  ~/.local/share/gnome-shell/extensions/workspace-number-indicator@nielsonrolim.github.io
cd ~/.local/share/gnome-shell/extensions/workspace-number-indicator@nielsonrolim.github.io
glib-compile-schemas schemas/
gnome-extensions enable workspace-number-indicator@nielsonrolim.github.io
```

Then reload GNOME Shell (X11: `killall -HUP gnome-shell`; Wayland: log out and back in).

## Settings

Open preferences with:

```bash
gnome-extensions prefs workspace-number-indicator@nielsonrolim.github.io
```

| Key | Type | Default | Effect |
|-----|------|---------|--------|
| `show-total` | boolean | `true` | `true` → shows `current / total` (e.g. `2 / 4`); `false` → shows only `current` (e.g. `2`) |
| `panel-position` | string | `'left'` | Which side of the panel: `'left'` or `'right'` |
| `left-placement` | string | `'after'` | When on the left: `'before'` or `'after'` the Activities button |

## Development

**Reload after changes (X11):**
```bash
killall -HUP gnome-shell
```

**Reload after changes (Wayland — nested session):**
```bash
dbus-run-session -- gnome-shell --nested --wayland
```

**View logs:**
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

**Recompile GSettings schema after editing the XML:**
```bash
glib-compile-schemas schemas/
```

## License

[GNU General Public License v2.0](LICENSE)
