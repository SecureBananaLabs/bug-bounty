<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: index.php');
    exit;
}
$users = [
    ['id'=>1, 'username'=>'alice_dev', 'email'=>'alice@example.com', 'role'=>'freelancer', 'status'=>'active', 'joined'=>'2026-01-15'],
    ['id'=>2, 'username'=>'bob_coder', 'email'=>'bob@example.com', 'role'=>'freelancer', 'status'=>'active', 'joined'=>'2026-02-20'],
    ['id'=>3, 'username'=>'charlie_sec', 'email'=>'charlie@example.com', 'role'=>'client', 'status'=>'active', 'joined'=>'2026-03-10'],
    ['id'=>4, 'username'=>'diana_hack', 'email'=>'diana@example.com', 'role'=>'freelancer', 'status'=>'suspended', 'joined'=>'2026-01-05'],
    ['id'=>5, 'username'=>'eve_admin', 'email'=>'eve@example.com', 'role'=>'admin', 'status'=>'active', 'joined'=>'2025-12-01'],
    ['id'=>6, 'username'=>'frank_test', 'email'=>'frank@example.com', 'role'=>'client', 'status'=>'banned', 'joined'=>'2026-04-18'],
    ['id'=>7, 'username'=>'grace_patch', 'email'=>'grace@example.com', 'role'=>'freelancer', 'status'=>'active', 'joined'=>'2026-05-01'],
    ['id'=>8, 'username'=>'heidi_audit', 'email'=>'heidi@example.com', 'role'=>'freelancer', 'status'=>'active', 'joined'=>'2026-05-12'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users - Admin Panel</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="sidebar">
        <h2>Bug Bounty Admin</h2>
        <nav>
            <a href="dashboard.php">Dashboard</a>
            <a href="users.php" class="active">Users</a>
            <a href="bounties.php">Bounties</a>
            <a href="index.php?logout=1">Logout</a>
        </nav>
    </div>
    <div class="main">
        <header>
            <h1>Users</h1>
            <p>Manage registered users</p>
        </header>
        <div class="filter-bar">
            <input type="text" placeholder="Search username or email...">
            <select><option>All Roles</option><option>Freelancer</option><option>Client</option><option>Admin</option></select>
            <select><option>All Status</option><option>Active</option><option>Suspended</option><option>Banned</option></select>
            <button class="btn btn-primary">Search</button>
        </div>
        <table>
            <thead>
                <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($users as $u): ?>
                <tr>
                    <td><?= $u['id'] ?></td>
                    <td><?= htmlspecialchars($u['username']) ?></td>
                    <td><?= htmlspecialchars($u['email']) ?></td>
                    <td><?= ucfirst($u['role']) ?></td>
                    <td><span class="badge <?= $u['status'] ?>"><?= ucfirst($u['status']) ?></span></td>
                    <td><?= $u['joined'] ?></td>
                    <td>
                        <button class="btn btn-primary btn-sm">View</button>
                        <button class="btn btn-sm" style="background:#f59e0b;color:#fff">Suspend</button>
                        <button class="btn btn-danger btn-sm">Ban</button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
<?php
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}
?>
