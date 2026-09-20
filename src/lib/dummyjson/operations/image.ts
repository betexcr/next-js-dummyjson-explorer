import type { ApiOperation, ParameterDefinition } from "../types";
import { op } from "./helpers";

const DOCS = "https://dummyjson.com/docs/image";

/** Optional path color segment shared by the image operations. */
function colorSegment(
  name: string,
  description: string,
  placeholder: string,
): ParameterDefinition {
  return {
    name,
    in: "path",
    type: "string",
    required: false,
    optionalPathSegment: true,
    description,
    placeholder,
  };
}

/** Query parameters documented for image generation. */
function imageQueryParams(): ParameterDefinition[] {
  return [
    {
      name: "text",
      in: "query",
      type: "string",
      required: false,
      description: "Text to render inside the image, e.g. `Hello+Peter`.",
      placeholder: "Hello Peter",
    },
    {
      name: "type",
      in: "query",
      type: "enum",
      required: false,
      description: "Output format. Defaults to PNG when omitted.",
      options: ["png", "jpg", "webp"],
      defaultValue: "png",
    },
    {
      name: "fontFamily",
      in: "query",
      type: "enum",
      required: false,
      description: "Font family used to render `text`, e.g. `pacifico`.",
      options: [
        "bitter",
        "cairo",
        "comfortaa",
        "cookie",
        "dosis",
        "gotham",
        "lobster",
        "marhey",
        "pacifico",
        "poppins",
        "quicksand",
        "qwigley",
        "satisfy",
        "ubuntu",
      ],
      placeholder: "pacifico",
    },
    {
      name: "fontSize",
      in: "query",
      type: "number",
      required: false,
      description: "Font size in pixels used to render `text`, e.g. `16`.",
      placeholder: "16",
    },
  ];
}

export const imageOperations: ApiOperation[] = [
  op(
    "image-square",
    "image",
    "Generate square image",
    "GET",
    "/image/{size}/{backgroundColor}/{textColor}",
    "Returns a square placeholder image of the given pixel size (1-5000), e.g. `/image/400`. Optionally append a background color and text color.",
    `${DOCS}#image-square`,
    {
      parameters: [
        {
          name: "size",
          in: "path",
          type: "number",
          required: true,
          description: "Square image size in pixels (1-5000).",
          placeholder: "400",
        },
        colorSegment(
          "backgroundColor",
          "Optional background color as a hex code without `#`, e.g. `008080`.",
          "008080",
        ),
        colorSegment(
          "textColor",
          "Optional text color as a hex code without `#`, e.g. `ffffff`. Only applies when a background color is also provided.",
          "ffffff",
        ),
        ...imageQueryParams(),
      ],
      responseKind: "binary",
      tags: ["image", "placeholder"],
    },
  ),
  op(
    "image-custom",
    "image",
    "Generate custom size image",
    "GET",
    "/image/{width}x{height}/{backgroundColor}/{textColor}",
    "Returns a placeholder image with the given width and height (1-5000 each), e.g. `/image/200x100`. Optionally append a background color and text color.",
    `${DOCS}#image-custom-size`,
    {
      parameters: [
        {
          name: "width",
          in: "path",
          type: "number",
          required: true,
          description: "Image width in pixels (1-5000).",
          placeholder: "200",
        },
        {
          name: "height",
          in: "path",
          type: "number",
          required: true,
          description: "Image height in pixels (1-5000).",
          placeholder: "100",
        },
        colorSegment(
          "backgroundColor",
          "Optional background color as a hex code without `#`, e.g. `008080`.",
          "008080",
        ),
        colorSegment(
          "textColor",
          "Optional text color as a hex code without `#`, e.g. `ffffff`. Only applies when a background color is also provided.",
          "ffffff",
        ),
        ...imageQueryParams(),
      ],
      responseKind: "binary",
      tags: ["image", "placeholder"],
    },
  ),
  op(
    "image-identicon",
    "image",
    "Generate identicon",
    "GET",
    "/icon/{hash}/{size}",
    "Returns an identicon generated from a hash string, e.g. `/icon/abc123/150`. PNG is the default format.",
    `${DOCS}#image-identicon`,
    {
      parameters: [
        {
          name: "hash",
          in: "path",
          type: "string",
          required: true,
          description: "Hash string used to derive the identicon pattern.",
          placeholder: "abc123",
        },
        {
          name: "size",
          in: "path",
          type: "number",
          required: true,
          description: "Identicon size in pixels, e.g. `150`.",
          placeholder: "150",
        },
        {
          name: "type",
          in: "query",
          type: "enum",
          required: false,
          description: "Output format. Defaults to PNG when omitted.",
          options: ["png", "svg"],
          defaultValue: "png",
        },
      ],
      responseKind: "binary",
      tags: ["image", "identicon", "placeholder"],
    },
  ),
];