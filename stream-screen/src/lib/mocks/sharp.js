const mock = () => ({
    removeAlpha: () => mock(),
    toBuffer: () => Promise.reject(new Error("Sharp is not available in the browser")),
});
export default mock;
