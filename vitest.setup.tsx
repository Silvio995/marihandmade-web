import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, unoptimized, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => (
    <a href={typeof href === "string" ? href : ""} {...rest}>
      {children}
    </a>
  ),
}));
