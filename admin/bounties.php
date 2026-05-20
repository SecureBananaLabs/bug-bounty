<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: index.php');
    exit;
}
$bounties = [
    ['id'=>1, 'title'=>'Fix XSS in login form', 'author'=>'alice_dev', 'reward'=>'$50', 'status'=>'open', 'submissions'=>3, 'created'=>'2026-05-15'],
    ['id'=>2, 'title'=>'Add input validation', 'author'=>'bob_coder', 'reward'=>'$100', 'status'=>'open', 'submissions'=>5, 'created'=>'2026-05-14'],
    ['id'=>3, 'title'=>'Rate limiting middleware', 'author'=>'charlie_sec', 'reward'=>'$200', 'status'=>'resolved', 'submissions'=>2, 'created'=>'2026-05-10'],
    ['id'=>4, 'title'=>'CSRF protection', 'author'=>'diana_hack', 'reward'=>'$75', 'status'=>'open', 'submissions'=>1, 'created'=>'2026-05-18'],
    ['id'=>5, 'title'=>'SQL injection fix', 'author'=>'eve_admin', 'reward'=>'$150', 'status'=>'flagged', 'submissions'=>0, 'created'=>'2026-05-19'],
    ['id'=>6, 'title'=>'JWT hardening', 'author'=>'frank_test', 'reward'=>'$250', 'status'=>'open', 'submissions'=>4, 'created'=>'2026-05-12'],
    ['id'=>7, 'title'=>'Docker security scan', 'author'=>'grace_patch', 'reward'=>'$80', 'status'=>'resolved', 'submissions'=>1, 'created'=>'2026-05-08'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bounties - Admin Panel</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="sidebar">
        <h2>Bug Bounty Admin</h2>
        <nav>
            <a href="dashboard.php">Dashboard</a>
            <a href="users.php">Users</a>
            <a href="bounties.php" class="active">Bounties</a>
            <a href="index.php?logout=1">Logout</a>
        </nav>
    </div>
    <div class="main">
        <header>
            <h1>Bounties</h1>
            <p>Manage bounty listings and submissions</p>
        </header>
        <div class="filter-bar">
            <input type="text" placeholder="Search bounties...">
            <select><option>All Status</option><option>Open</option><option>Flagged</option><option>Resolved</option></select>
            <button class="btn btn-primary">Search</button>
            <button class="btn btn-sm" style="background:#10b981;color:#fff">+ New Bounty</button>
        </div>
        <table>
            <thead>
                <tr><th>ID</th><th>Title</th><th>Author</th><th>Reward</th><th>Status</th><th>Submissions</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($bounties as $b): ?>
                <tr>
                    <td><?= $b['id'] ?></td>
                    <td><?= htmlspecialchars($b['title']) ?></td>
                    <td><?= htmlspecialchars($b['author']) ?></td>
                    <td><?= $b['reward'] ?></td>
                    <td><span class="badge <?= $b['status'] === 'open' ? 'open' : ($b['status'] === 'resolved' ? 'resolved' : ($b['status'] === 'flagged' ? 'suspended' : '')) ?>"><?= ucfirst($b['status']) ?></span></td>
                    <td><?= $b['submissions'] ?></td>
                    <td><?= $b['created'] ?></td>
                    <td>
                        <button class="btn btn-primary btn-sm">Approve</button>
                        <button class="btn btn-danger btn-sm">Flag</button>
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
