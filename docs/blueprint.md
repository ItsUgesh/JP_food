# **App Name**: JP Cafe POS

## Core Features:

- User Authentication & Roles: Secure staff login using Firebase Authentication, supporting distinct 'admin' (menu management) and 'staff' (order processing) roles.
- Menu Management: Admin users can perform CRUD operations (add, edit, delete) on menu items (name, price, category). Items are stored in the 'menu_items' Firestore collection and displayed in a card format.
- Order Taking Interface: An interactive Point of Sale (POS) screen for staff to quickly add/remove menu items, adjust quantities, specify a table number, and view item subtotals and the total order price.
- Order Workflow & Payments: Manage order status transitions from 'pending' to 'paid', with options for selecting payment methods (Cash/eSewa). This feature updates order details (status, paymentMethod, paidAt) in Firestore, restricting edits to paid orders.
- Order Tracking Display: A dedicated UI for staff to view both 'pending' and 'paid' orders. Each order card displays table number, total amount, creation time, and a color-coded status badge (yellow for pending, green for paid), along with filtering options.
- Sales Reporting Dashboard: A dashboard view showing key metrics for today's sales, including total revenue from paid orders, a list of recent orders, and the total count of orders processed.
- Thermal-Optimized Receipt Generation: Generate a clean, printable receipt UI (optimized for 80mm thermal printers) for completed orders, featuring cafe name, table number, itemized list, total, payment method, and transaction timestamp. Includes a 'Print Bill' button.

## Style Guidelines:

- Color scheme: Predominantly light mode for a clean and professional appearance, with a planned dark mode toggle to support user preference and different lighting environments.
- Primary Color: An earthy red-orange (#994729) serves as the primary hue, providing warmth inspired by the 'tandoori' aspect of the cafe, while maintaining a professional depth that contrasts well with light backgrounds.
- Background Color: A very light, warm off-white (#FDF7F5) forms the base, creating a spacious and inviting canvas that is easy on the eyes.
- Accent Color: A vibrant goldenrod yellow (#E0C71A) is used to highlight interactive elements, calls-to-action, and critical information, adding a dynamic and easily noticeable touch.
- All text: 'Inter', a modern grotesque sans-serif font. Its neutral yet highly readable characteristics are ideal for clear display of numerical and text data in a fast, efficient POS system across headlines and body content.
- Utilize clean, minimal, and intuitive outlined or flat icons to ensure a decluttered and fast user experience. Order status badges will adhere to the requested 'yellow' for pending and 'green' for paid states.
- Implement a fully responsive and adaptive layout using Tailwind CSS. The primary interface will feature a split-panel design for menu and cart on desktop/tablet, fluidly adapting to mobile for optimal usability. A card-based design will be used for menu items and order lists.
- Incorporate subtle and quick animations for feedback on user interactions, such as adding items to the cart or transitioning order statuses, to enhance the perception of speed and responsiveness without introducing visual clutter.