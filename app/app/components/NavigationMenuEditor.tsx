import { useState, useEffect, useCallback } from "react";

interface NavigationMenuEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Available navigation menu items
const AVAILABLE_MENUS = [
  { id: "Trading", label: "Trading", icon: "i-mdi:chart-line" },
  { id: "Portfolio", label: "Portfolio", icon: "i-mdi:wallet-outline" },
  { id: "Markets", label: "Markets", icon: "i-mdi:chart-box-outline" },
  { id: "Leaderboard", label: "Leaderboard", icon: "i-mdi:trophy-outline" },
];

const NavigationMenuEditor: React.FC<NavigationMenuEditorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  // Parse the comma-separated string into an ordered array of enabled menu items
  const parseMenus = useCallback((menuString: string): string[] => {
    if (!menuString) return [];
    return menuString
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }, []);

  // State for the currently enabled and ordered menu items
  const [enabledMenus, setEnabledMenus] = useState<string[]>(() =>
    parseMenus(value)
  );

  // Track the item being dragged
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<string | null>(null);

  // Effect to update parent when enabledMenus changes
  useEffect(() => {
    onChange(enabledMenus.join(","));
  }, [enabledMenus, onChange]);

  // Effect to update local state when the parent value changes
  useEffect(() => {
    setEnabledMenus(parseMenus(value));
  }, [value, parseMenus]);

  // Toggle a menu item on/off
  const toggleMenu = (menuId: string) => {
    setEnabledMenus(current => {
      if (current.includes(menuId)) {
        // Remove it if already enabled
        return current.filter(id => id !== menuId);
      } else {
        // Add it if not enabled
        return [...current, menuId];
      }
    });
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, menuId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(menuId);
  };

  // Handle drag over another item
  const handleDragOver = (e: React.DragEvent, menuId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItem || draggedItem === menuId) return;

    // Set the item being dragged over for visual feedback
    setDraggedOverItem(menuId);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, menuId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === menuId) return;

    // Find the indices of the dragged item and the item being dragged over
    const draggedIndex = enabledMenus.indexOf(draggedItem);
    const targetIndex = enabledMenus.indexOf(menuId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder the enabled menus array
    const newMenus = [...enabledMenus];
    newMenus.splice(draggedIndex, 1);
    newMenus.splice(targetIndex, 0, draggedItem);

    setEnabledMenus(newMenus);
    setDraggedOverItem(null);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add info card explaining optional configuration */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex items-start">
        <div className="i-mdi:information-outline h-5 w-5 mr-2 text-primary-light flex-shrink-0 mt-0.5"></div>
        <div className="text-gray-300">
          <p className="mb-1">
            Configuring navigation menus is{" "}
            <span className="text-primary-light font-medium">optional</span>. If
            you don't select any menus, the default menus will be displayed.
          </p>
          <p className="text-xs text-gray-400">
            Default navigation includes: Trading, Portfolio, Markets, and
            Leaderboard pages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mb-4">
        {AVAILABLE_MENUS.map(menu => (
          <label
            key={menu.id}
            className={`flex items-center space-x-2 cursor-pointer p-2 rounded 
              ${enabledMenus.includes(menu.id) ? "bg-primary/20 border-primary/30" : "bg-dark/50 border-light/10"} 
              border transition-colors hover:bg-dark/70`}
          >
            <input
              type="checkbox"
              checked={enabledMenus.includes(menu.id)}
              onChange={() => toggleMenu(menu.id)}
              className="form-checkbox rounded bg-dark border-gray-500 text-primary focus:ring-primary"
            />
            <div className="flex items-center space-x-2">
              <div className={`${menu.icon} h-5 w-5`}></div>
              <span>{menu.label}</span>
            </div>
          </label>
        ))}
      </div>

      {enabledMenus.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Menu Order</div>
            <div className="text-xs text-gray-400">Drag items to reorder</div>
          </div>
          <div className="border border-light/10 rounded-lg p-2 bg-dark/30">
            <ul className="space-y-2">
              {enabledMenus.map((menuId, index) => {
                const menu = AVAILABLE_MENUS.find(m => m.id === menuId);
                if (!menu) return null;

                return (
                  <li
                    key={menuId}
                    draggable
                    onDragStart={e => handleDragStart(e, menuId)}
                    onDragOver={e => handleDragOver(e, menuId)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, menuId)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2 rounded border
                      ${draggedItem === menuId ? "opacity-50" : "opacity-100"}
                      ${draggedOverItem === menuId ? "border-primary border-dashed bg-primary/10" : "border-light/10 bg-dark/50"} 
                      cursor-move hover:bg-dark/70 transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="i-mdi:drag h-5 w-5 text-gray-400"></div>
                      <div className={`${menu.icon} h-5 w-5`}></div>
                      <span>{menu.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs px-2 py-1 rounded-full bg-dark/50 text-gray-400">
                        {index + 1}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {enabledMenus.length === 0 && (
        <div className="text-sm text-warning border border-warning/20 bg-warning/10 p-3 rounded flex items-center">
          <div className="i-mdi:alert-circle-outline h-5 w-5 mr-2"></div>
          <span>No menu items selected. Default menus will be displayed.</span>
        </div>
      )}
    </div>
  );
};

export default NavigationMenuEditor;
