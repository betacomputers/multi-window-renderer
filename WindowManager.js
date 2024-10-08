class WindowManager {
  #windows = [];
  #count = 0;
  #id = null;
  #winData = null;
  #winShapeChangeCallback = null;
  #winChangeCallback = null;

  constructor() {
    // Bind the event listeners to the current instance
    this.#initializeStorageListener();
    this.#initializeUnloadListener();
  }

  // Initialize the event listener for localStorage changes from another window
  #initializeStorageListener() {
    addEventListener("storage", (event) => {
      if (event.key === "windows") {
        const newWindows = JSON.parse(event.newValue);
        if (this.#didWindowsChange(this.#windows, newWindows)) {
          this.#windows = newWindows;
          if (this.#winChangeCallback) this.#winChangeCallback();
        }
      }
    });
  }

  // Initialize the event listener for window unload to remove the window from the list
  #initializeUnloadListener() {
    window.addEventListener("beforeunload", () => {
      const index = this.#getWindowIndexById(this.#id);
      if (index > -1) {
        this.#windows.splice(index, 1);
        this.#updateWindowsLocalStorage();
      }
    });
  }

  // Compare two windows arrays and return if they differ
  #didWindowsChange(previousWindows, newWindows) {
    if (previousWindows.length !== newWindows.length) return true;

    return previousWindows.some((win, i) => win.id !== newWindows[i].id);
  }

  // Initialize the current window with optional metadata
  init(metaData = {}) {
    this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
    this.#count = parseInt(localStorage.getItem("count") || "0", 10) + 1;

    this.#id = this.#count;
    const shape = this.#getWindowShape();
    this.#winData = { id: this.#id, shape, metaData };

    this.#windows.push(this.#winData);

    localStorage.setItem("count", this.#count);
    this.#updateWindowsLocalStorage();
  }

  // Get the current window's shape and dimensions
  #getWindowShape() {
    return {
      x: window.screenLeft,
      y: window.screenTop,
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }

  // Find the index of a window by its ID
  #getWindowIndexById(id) {
    return this.#windows.findIndex((win) => win.id === id);
  }

  // Update the windows list in localStorage
  #updateWindowsLocalStorage() {
    localStorage.setItem("windows", JSON.stringify(this.#windows));
  }

  // Update the current window's shape and check for changes
  update() {
    const currentShape = this.#getWindowShape();

    if (
      currentShape.x !== this.#winData.shape.x ||
      currentShape.y !== this.#winData.shape.y ||
      currentShape.w !== this.#winData.shape.w ||
      currentShape.h !== this.#winData.shape.h
    ) {
      this.#winData.shape = currentShape;
      const index = this.#getWindowIndexById(this.#id);
      if (index > -1) {
        this.#windows[index].shape = currentShape;
      }

      if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
      this.#updateWindowsLocalStorage();
    }
  }

  // Set the callback for window shape changes
  setWinShapeChangeCallback(callback) {
    this.#winShapeChangeCallback = callback;
  }

  // Set the callback for window changes
  setWinChangeCallback(callback) {
    this.#winChangeCallback = callback;
  }

  // Get the list of all windows
  getWindows() {
    return this.#windows;
  }

  // Get the current window's data
  getThisWindowData() {
    return this.#winData;
  }

  // Get the current window's ID
  getThisWindowID() {
    return this.#id;
  }
}

export default WindowManager;
