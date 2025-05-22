import "@testing-library/jest-dom";

jest.useFakeTimers();

global.requestIdleCallback = (callback) => {
  const id = setTimeout(() => callback({ timeRemaining: () => 50 }), 0);
  return id;
};

global.cancelIdleCallback = (id) => {
  clearTimeout(id);
};
