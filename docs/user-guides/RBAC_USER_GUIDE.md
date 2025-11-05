# RBAC User Guide - Roles and Permissions

## Introduction

This guide will help you understand and manage user permissions in your system using Roles and Permissions. Don't worry if you're not technical - we'll explain everything in simple terms!

## What Are Roles and Permissions?

### Permissions
Think of permissions as "keys" that unlock specific features in the system. For example:
- A key to **view** products
- A key to **create** new sales
- A key to **edit** customer information
- A key to **delete** old records

### Roles
A role is like a "key ring" that holds multiple permission keys. Instead of giving each person individual keys one by one, we create a role (key ring) with all the keys they need, and then give them that role.

**Example:**
- A **Cashier** role has keys to create sales and view products, but not to delete anything
- An **Admin** role has keys to do almost everything in the system
- An **Owner** role has ALL the keys

## Available System Roles

Your system comes with 7 predefined roles. You can use these roles as-is, or create custom roles for your specific needs.

### 1. Owner (Full Access)
**Who is this for?** Business owners, CEOs

**What can they do?**
- Everything in the system
- Create and delete other users
- Change any settings
- View all reports and data
- Manage roles and permissions

**When to use:** Only assign this to people who own or run the business.

### 2. Admin (Administrator)
**Who is this for?** General managers, IT administrators

**What can they do?**
- Manage users (create, edit, remove)
- Manage products, sales, inventory, and customers
- View reports
- Create and manage custom roles
- Cannot delete the Owner or change critical system settings

**When to use:** For trusted managers who need to handle day-to-day operations and user management.

### 3. Manager (Store/Department Manager)
**Who is this for?** Store managers, department heads

**What can they do?**
- Full control over products, sales, inventory, and customers
- View reports
- View user list (but cannot create or delete users)
- Cannot manage roles or system settings

**When to use:** For supervisors who manage operations but don't need to manage users or system settings.

### 4. Cashier (Point of Sale)
**Who is this for?** Cashiers, sales associates

**What can they do?**
- Create new sales
- View existing sales
- View product information
- View and create customers
- View inventory levels
- Cannot edit or delete anything

**When to use:** For front-line staff who process sales but shouldn't modify critical data.

### 5. Inventory Manager
**Who is this for?** Warehouse staff, inventory specialists

**What can they do?**
- Full control over inventory and products
- Manage purchase orders
- Manage suppliers
- View inventory reports
- Cannot manage sales or customers

**When to use:** For staff responsible for stock management and ordering.

### 6. Sales Representative
**Who is this for?** Sales reps, account managers

**What can they do?**
- Create, view, and edit sales
- Full control over customers
- View products
- Create and manage quotes
- View sales reports

**When to use:** For salespeople who work with customers but don't manage inventory.

### 7. Accountant (Financial)
**Who is this for?** Accountants, bookkeepers

**What can they do?**
- View sales data
- Manage invoices and payments
- Manage expenses
- View all financial reports
- Cannot create or edit operational data

**When to use:** For financial staff who need to track money but don't need to manage operations.

## How to Manage Roles

### Viewing All Roles

1. Log in to your system
2. Go to **Settings** → **Roles and Permissions**
3. You'll see a list of all available roles

**What you'll see:**
- System roles (Owner, Admin, etc.) with a "System" badge
- Custom roles created by your organization
- Number of users assigned to each role
- List of permissions for each role

### Creating a Custom Role

Sometimes the predefined roles don't match your needs. You can create custom roles!

**Example:** You might want a "Social Media Manager" role that can view sales reports and manage customer information, but nothing else.

**Steps:**
1. Go to **Settings** → **Roles and Permissions**
2. Click the **"Create Role"** button
3. Fill in:
   - **Name**: Give it a clear name (e.g., "Social Media Manager")
   - **Description**: Explain what this role is for
4. Select permissions by checking boxes:
   - Browse through categories (Products, Sales, Customers, etc.)
   - Check the boxes for what this role needs to do
   - You can select multiple permissions
5. Click **"Create Role"**

**Tip:** Start with fewer permissions and add more later if needed. It's safer than giving too much access.

### Understanding Permission Levels

For each resource (like Products, Sales, Customers), there are different permission levels:

| Permission | What It Means | Example |
|------------|---------------|---------|
| **READ** | Can view/see information | Can see the list of products and their details |
| **CREATE** | Can add new items | Can add a new product to the catalog |
| **UPDATE** | Can edit existing items | Can change a product's price or description |
| **DELETE** | Can remove items | Can delete a product from the catalog |
| **MANAGE** | Can do everything | Can create, view, edit, AND delete products |

**Special Permission:** **MANAGE** is like a master key - it grants all other permissions for that resource.

### Editing a Role

You can change the permissions for any custom role (but not system roles).

**Steps:**
1. Go to **Settings** → **Roles and Permissions**
2. Find the role you want to edit
3. Click the **"Edit"** button
4. Check or uncheck permission boxes
5. Click **"Save Changes"**

**Note:** Changes take effect immediately for all users with that role. They might need to log out and log back in to see the changes.

### Deleting a Role

You can only delete custom roles (not system roles like Owner, Admin, etc.).

**Before you delete:**
- Make sure no users are assigned to that role
- Or reassign those users to a different role first

**Steps:**
1. Go to **Settings** → **Roles and Permissions**
2. Find the role you want to delete
3. Click the **"Delete"** button
4. Confirm the deletion

## How to Assign Roles to Users

### When Creating a New User

1. Go to **Settings** → **Users**
2. Click **"Add User"**
3. Fill in the user's information (name, email, password)
4. In the **"Role"** dropdown, select the appropriate role
5. Click **"Create User"**

### Changing a User's Role

1. Go to **Settings** → **Users**
2. Find the user you want to modify
3. Click **"Edit"** or click on the user's name
4. In the **"Role"** dropdown, select a different role
5. Click **"Save"**

**Important:** When you change a user's role, they immediately get the permissions from the new role and lose permissions from the old role.

## Viewing Audit Logs

Audit logs show you who did what in the system. This is useful for:
- Security (who accessed sensitive data?)
- Accountability (who made this change?)
- Troubleshooting (what happened before this error?)

### Accessing Audit Logs

1. Go to **Settings** → **Audit Logs**
2. You'll see a list of recent actions

**What you'll see:**
- Who performed the action (user name)
- What they did (Created, Updated, Deleted, etc.)
- Which resource was affected (Products, Sales, etc.)
- When it happened (date and time)
- Their IP address and device

### Filtering Audit Logs

You can narrow down the logs to find what you're looking for:

**By Action:**
- Click **"All Actions"** dropdown
- Select CREATE, UPDATE, DELETE, or READ

**By Resource:**
- Click **"All Resources"** dropdown
- Select what you want to see (Products, Sales, Users, etc.)

**By User:**
- Type a user's name in the search box

**By Date:**
- Click the date picker
- Select a date range

### Understanding Audit Log Statistics

At the top of the Audit Logs page, you'll see statistics:
- **Total Records**: How many actions have been logged
- **Most Active Users**: Who is using the system the most
- **Actions Breakdown**: How many creates, updates, deletes, etc.

## Best Practices and Tips

### For Assigning Roles

1. **Start Restrictive**: Give users the minimum permissions they need. You can always add more later.

2. **Review Regularly**: Every few months, review who has which roles. Remove access for people who no longer need it.

3. **Use System Roles When Possible**: The predefined roles cover most common scenarios. Only create custom roles when truly needed.

4. **Document Custom Roles**: When you create a custom role, write down why you created it and what it's for.

5. **Test Before Rolling Out**: When creating a new role, test it with one user first before assigning it to many people.

### For Security

1. **Limit Owner Role**: Only give the Owner role to people who absolutely need full system access.

2. **Separate Duties**: Don't give one person too many permissions. For example, the person who creates sales shouldn't also be able to delete audit logs.

3. **Monitor Audit Logs**: Check the audit logs occasionally for suspicious activity.

4. **Remove Inactive Users**: When someone leaves your organization, immediately change their role or deactivate their account.

### For Training

1. **Show New Users**: When you assign someone a role, show them what they can and cannot do in the system.

2. **Explain Limitations**: If users complain they can't access something, explain why that permission isn't part of their role.

3. **Provide This Guide**: Share this guide with anyone who manages users or roles.

## Common Questions (FAQ)

### Can I change system roles like Owner or Admin?
No, system roles are predefined and cannot be modified. This ensures consistency and security. However, you can create custom roles based on your needs.

### What happens if I delete a role that has users?
You cannot delete a role if users are still assigned to it. You must first reassign those users to a different role.

### Can a user have multiple roles?
No, each user can only have one role at a time. If you need a user to have permissions from multiple roles, create a custom role that combines those permissions.

### Why can't I see the "Create Role" button?
You need the **ROLES:CREATE** permission to create roles. This is typically only available to Owners and Admins. Ask your administrator if you need this access.

### Someone's permissions changed but they still see the old screens. Why?
Permissions are checked when the user logs in. Ask them to log out and log back in, and they should see the updated permissions.

### Can I temporarily give someone extra permissions?
Yes! Change their role to one with more permissions, and then change it back later. Or create a temporary custom role.

### How long are audit logs kept?
This depends on your system configuration. Check with your IT administrator or system owner.

### Can I export audit logs?
Yes, most systems allow you to export audit logs. Look for an "Export" or "Download" button on the Audit Logs page.

## Common Mistakes to Avoid

### 1. Giving Everyone Admin Access
**Problem:** "Everyone is an admin so no one complains about not having access."

**Why it's bad:** This defeats the purpose of security. If everyone can do everything, one mistake could delete critical data.

**Solution:** Assign appropriate roles based on job responsibilities.

### 2. Creating Too Many Custom Roles
**Problem:** "I have 20 custom roles and can't remember what each one does."

**Why it's bad:** Too many roles become hard to manage and confusing.

**Solution:** Use system roles when possible. Only create custom roles for truly unique needs.

### 3. Never Reviewing Permissions
**Problem:** "We set up roles 2 years ago and never looked at them again."

**Why it's bad:** People's roles change, and old permissions might no longer be appropriate.

**Solution:** Review roles and user assignments quarterly.

### 4. Not Testing Custom Roles
**Problem:** "I created a role and assigned it to 10 people, but it has the wrong permissions."

**Why it's bad:** Now 10 people either can't do their jobs or have too much access.

**Solution:** Test new roles with one user first, then roll out.

### 5. Ignoring Audit Logs
**Problem:** "Something went wrong, but we can't figure out what happened."

**Why it's bad:** Audit logs are your safety net for understanding and investigating issues.

**Solution:** Regularly review audit logs, especially for sensitive operations.

## Getting Help

If you need help with roles and permissions:

1. **Check this guide first** - Most common questions are answered here
2. **Ask your administrator** - Someone with Owner or Admin role in your organization
3. **Check audit logs** - They might explain what happened
4. **Contact support** - If you think there's a bug or technical issue

## Glossary

- **Permission**: Authorization to perform a specific action (like create, read, update, delete)
- **Role**: A collection of permissions assigned to users
- **System Role**: A predefined role that cannot be modified (Owner, Admin, etc.)
- **Custom Role**: A role created by your organization for specific needs
- **Resource**: Something in the system that can be accessed (Products, Sales, Customers, etc.)
- **Action**: What you can do with a resource (CREATE, READ, UPDATE, DELETE, MANAGE)
- **Audit Log**: A record of who did what in the system
- **MANAGE Permission**: A special permission that grants all other permissions for a resource
- **Tenant**: Your organization's isolated environment in the system
- **RBAC**: Role-Based Access Control - the system that manages roles and permissions

## Quick Reference

### Who Can Do What?

| Task | Owner | Admin | Manager | Cashier | Inv. Manager | Sales Rep | Accountant |
|------|-------|-------|---------|---------|--------------|-----------|------------|
| Create Sales | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete Sales | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Products | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage Customers | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Finances | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Permission Hierarchy

```
Owner (ALL:MANAGE)
└─ Has every possible permission

Admin
├─ Users: Full control
├─ Roles: Full control
├─ Products: Full control
├─ Sales: Full control
├─ Inventory: Full control
├─ Customers: Full control
└─ Reports: View only

Manager
├─ Products: Full control
├─ Sales: Full control
├─ Inventory: Full control
├─ Customers: Full control
├─ Reports: View only
└─ Users: View only

And so on...
```

---

**Remember:** When in doubt, ask your system administrator. It's better to ask than to give someone the wrong permissions!
