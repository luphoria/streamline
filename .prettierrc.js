/**
 * @type {import("prettier").Config}
 */
const config = {
	trailingComma: "es5",
	useTabs: true,
	semi: true,
	singleQuote: false,
	plugins: ["prettier-plugin-astro"],
};

export default config;
