# FormIO Portal UI Enhancer

A comprehensive Tampermonkey script designed to significantly improve the developer experience within the Form.io Designer and Portal environments. It adds critical missing features like component folding, a structural mini-map, and a live developer overview panel.

> [!NOTE]
> This script is verified to work with **Form IO Portal version 9.x**. Compatibility with older versions is currently untested.

## 🚀 Key Features

### 🛠️ Developer Overview Panel
A floating, modern UI panel that provides real-time information about the active form instances on the page.
- **Form Metadata**: Quickly see the Form Path, Name, and Environment Stage (UAT, Live, etc.).
- **Live Data Inspection**: View and copy the `inst.data` and `submission` JSON objects with a single click.
- **Copy to Clipboard**: Dedicated buttons to copy paths, IDs, and full JSON payloads.
- **State Persistence**: The panel remembers if it was minimized or expanded across page reloads.

### 🗺️ Form Structure Mini-Map
Never get lost in complex nested forms again.
- **Hierarchy Visualization**: A tree-like view of your form's structure (Containers, Fieldsets, Panels, Wells).
- **Click-to-Navigate**: Clicking an item in the mini-map automatically scrolls the designer to that component and highlights it briefly.
- **Fold Status Sync**: Reflects the expanded/collapsed state of components in real-time.

### 📂 Component Folding (Designer)
Clean up your workspace by collapsing large containers.
- **Support for Structural Components**: Fold Containers, Fieldsets, Panels, and Wells.
- **Intelligent Headers**: Automatically injects "(not set)" labels for components without a title so they can still be toggled.
- **Safe Interaction**: Designed to ignore clicks on inputs and designer action buttons, preventing accidental folding during configuration.

### 📝 Integrated ACE Editor
Replaces the basic textareas in Form.io settings with the powerful ACE Editor.
- **Syntax Highlighting**: Specialized modes for HTML, JavaScript, and Nunjucks.
- **Prettify Feature**: One-button formatting for messy code blocks.
- **Large Workspace**: Provides a much larger, scrollable area for writing complex logic or templates.

### ✨ UI Refinements
- **Flattened Navigation**: Moves hidden menu items (API, Revisions, Logs, Settings) from the dropdown to the top-level navigation for faster access.
- **Dynamic Title Fetching**: Automatically resolves form IDs into human-readable titles in the header.
- **Clean Layout**: Fixes common layout bugs in the Form.io portal to maximize screen real estate.

## 🛠️ Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2. Create a new script in Tampermonkey.
3. Copy the contents of `formio-portal-ui-enhancer.user.js` into the editor.
4. **Configure Match Rules**: Update the `@match` section in the script header to include your organization's specific Form IO portal URLs.
5. Save and refresh your Form IO portal page.

> [!IMPORTANT]
> By default, the script only matches `portal.form.io` and `next.form.io`. If you use a self-hosted or branded version of the Form IO portal, you **must** add your domain to the Tampermonkey script header for it to activate.