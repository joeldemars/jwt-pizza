import { Page } from "@playwright/test";
import { User, Role } from "../src/service/pizzaService";

async function basicInit(page: Page) {
    let loggedInUser: User | undefined;
    const validUsers: Record<string, User> = {
        "d@jwt.com": {
            id: "3",
            name: "Kai Chen",
            email: "d@jwt.com",
            password: "a",
            roles: [{ role: Role.Diner }],
        },
        "a@jwt.com": {
            id: "2",
            name: "Test Admin",
            email: "a@jwt.com",
            password: "admin",
            roles: [{ role: Role.Admin }],
        },
        "f@jwt.com": {
            id: "4",
            name: "Owner",
            email: "f@jwt.com",
            password: "f",
            roles: [{ role: Role.Franchisee }],
        },
    };

    // Authorize login/register for the given user
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() == "PUT") {
            const loginReq = route.request().postDataJSON();
            const user = validUsers[loginReq.email];
            if (!user || user.password !== loginReq.password) {
                await route.fulfill({
                    status: 401,
                    json: { error: "Unauthorized" },
                });
                return;
            }
            loggedInUser = validUsers[loginReq.email];
            const loginRes = {
                user: loggedInUser,
                token: "abcdef",
            };
            await route.fulfill({ json: loginRes });
        } else if (route.request().method() == "POST") {
            await route.fulfill({
                json: {
                    user: {
                        id: "4",
                        name: "John",
                        email: "john@pizza.com",
                        roles: [{ role: Role.Diner }],
                    },
                    token: "xyzuvw",
                },
            });
        } else if (route.request().method() == "DELETE") {
            await route.fulfill({
                json: {
                    message: "logout successful",
                },
            });
        }
    });

    // Return  user
    await page.route("*/**/api/user/*", async (route) => {
        await route.fulfill({ json: validUsers["d@jwt.com"] });
    });

    await page.route("*/**/api/user*", async (route) => {
        await route.fulfill({ json: {
            users: Object.values(validUsers),
            more: false,
        }});
    });

    // Return the currently logged in user
    await page.route("*/**/api/user/me", async (route) => {
        // expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: loggedInUser });
    });

    // A standard menu
    await page.route("*/**/api/order/menu", async (route) => {
        const menuRes = [
            {
                id: 1,
                title: "Veggie",
                image: "pizza1.png",
                price: 0.0038,
                description: "A garden of delight",
            },
            {
                id: 2,
                title: "Pepperoni",
                image: "pizza2.png",
                price: 0.0042,
                description: "Spicy treat",
            },
        ];
        // expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });

    // Standard franchises and stores
    await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
        if (route.request().method() == "GET") {
            const franchiseRes = {
                franchises: [
                    {
                        id: 2,
                        name: "LotaPizza",
                        stores: [
                            { id: 4, name: "Lehi" },
                            { id: 5, name: "Springville" },
                            { id: 6, name: "American Fork" },
                        ],
                    },
                    {
                        id: 3,
                        name: "PizzaCorp",
                        stores: [{ id: 7, name: "Spanish Fork" }],
                    },
                    { id: 4, name: "topSpot", stores: [] },
                ],
            };
            await route.fulfill({ json: franchiseRes });
        } else if (route.request().method() == "POST") {
            await route.fulfill({
                json: {
                    name: "New franchise",
                    admins: [{ email: "a@jwt.com", id: 2, name: "Test Admin" }],
                    id: 7,
                },
            });
        } else if (route.request().method() == "delete") {
            await route.fulfill({ json: { message: "franchise deleted" } });
        }
    });

    // User franchise
    await page.route("*/**/api/franchise/*", async (route) => {
        await route.fulfill({
            json: [
                {
                    id: 2,
                    name: "pizzaPocket",
                    admins: [
                        { id: 4, name: "pizza franchisee", email: "f@jwt.com" },
                    ],
                    stores: [{ id: 4, name: "SLC", totalRevenue: 0 }],
                },
            ],
        });
    });

    // User store
    await page.route("*/**/api/franchise/*/store", async (route) => {
        await route.fulfill({
            json: { id: 2, name: "pizzaPocket", totalRevenue: 0 },
        });
    });

    // Order a pizza.
    await page.route("*/**/api/order", async (route) => {
        if (route.request().method() == "POST") {
            const orderReq = route.request().postDataJSON();
            const orderRes = {
                order: { ...orderReq, id: 23 },
                jwt: "eyJpYXQ",
            };
            await route.fulfill({ json: orderRes });
        } else if (route.request().method() == "GET") {
            await route.fulfill({
                json: {
                    dinerId: 4,
                    orders: [
                        {
                            id: 1,
                            franchiseId: 1,
                            storeId: 1,
                            date: "2024-06-05T05:14:40.000Z",
                            items: [
                                {
                                    id: 1,
                                    menuId: 1,
                                    description: "Veggie",
                                    price: 0.05,
                                },
                            ],
                        },
                    ],
                    page: 1,
                },
            });
        }
    });

    await page.goto("/");
}

async function loginAsAdmin(page: Page) {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'Admin' }).click();
}

async function loginAsDiner(page: Page) {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
}

async function loginAsFranchisee(page: Page) {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('f');
    await page.getByRole('button', { name: 'Login' }).click();
}

export { basicInit, loginAsAdmin, loginAsDiner, loginAsFranchisee };
