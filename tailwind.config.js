const { flavors } = require('@catppuccin/palette');
const plugin = require('tailwindcss/plugin');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a Catppuccin HSL object to "H S% L%" (shadcn/Tailwind format) */
const toHsl = ({ h, s, l }) =>
	`${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;

/** Build a flat record of CSS vars from a Catppuccin flavor, e.g.
 *  { '--ctp-latte-yellow': '35 77% 49%', ... }
 */
const paletteVars = (prefix, flavor) =>
	Object.fromEntries(
		Object.entries(flavor.colors).map(([name, color]) => [
			`--ctp-${prefix}-${name}`,
			toHsl(color.hsl),
		]),
	);

// ─── Plugin: inject Catppuccin tokens as CSS variables ───────────────────────

const catppuccinPlugin = plugin(({ addBase }) => {
	addBase({
		':root': paletteVars('latte', flavors.latte),
		'html[data-theme="dark"], .dark': paletteVars('mocha', flavors.mocha),
	});
});

// ─── Config ─────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class', '[data-theme="dark"]'],
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Nunito', 'sans-serif'],
				sketch: ['Architects Daughter', 'cursive'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
			},
			typography: () => ({
				DEFAULT: {
					css: {
						'--tw-prose-body': 'hsl(var(--foreground))',
						'--tw-prose-headings': 'hsl(var(--foreground))',
						'--tw-prose-lead': 'hsl(var(--muted-foreground))',
						'--tw-prose-links': 'hsl(var(--primary))',
						'--tw-prose-bold': 'hsl(var(--foreground))',
						'--tw-prose-counters': 'hsl(var(--muted-foreground))',
						'--tw-prose-bullets': 'hsl(var(--muted-foreground))',
						'--tw-prose-hr': 'hsl(var(--border))',
						'--tw-prose-quotes': 'hsl(var(--muted-foreground))',
						'--tw-prose-quote-borders': 'hsl(var(--primary))',
						'--tw-prose-captions': 'hsl(var(--muted-foreground))',
						'--tw-prose-code': 'hsl(var(--primary))',
						'--tw-prose-pre-bg': 'transparent',
						'--tw-prose-th-borders': 'hsl(var(--border))',
						'--tw-prose-td-borders': 'hsl(var(--border))',
					},
				},
			}),
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
		catppuccinPlugin,
	],
};