import Oregion from "oregion";

describe("createElement", () => {
  test("creates an element with type and props", () => {
    const element = Oregion.createElement("div", { id: "test" }, "Hello");
    expect(element).toEqual({
      type: "div",
      props: {
        id: "test",
        children: [
          {
            type: "TEXT_ELEMENT",
            props: {
              nodeValue: "Hello",
              children: [],
            },
          },
        ],
      },
    });
  });

  test("handles multiple children", () => {
    const element = Oregion.createElement("div", { className: "container" }, Oregion.createElement("span", null, "First"), "Second");
    expect(element.props.children).toHaveLength(2);
    expect(element.props.children[0].type).toBe("span");
    expect(element.props.children[1].type).toBe("TEXT_ELEMENT");
  });

  test("handles no children", () => {
    const element = Oregion.createElement("div", { id: "empty" });
    expect(element.props.children).toEqual([]);
  });
});
