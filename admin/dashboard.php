<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: index.php');
    exit;
}
$stats = [
    'total_users' => 1248,
    'active_bounties' => 67,
    'total_submissions' => 892,
    'pending_reviews' => 23,
    'flagged_listings' => 12,
    'open_disputes' => 8,
    'revenue_month' => '$4,320',
    'new_users_today' => 14,
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Admin Panel</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="sidebar">
        <h2>Bug Bounty Admin</h2>
        <nav>
            <a href="dashboard.php" class="active">Dashboard</a>
            <a href="users.php">Users</a>
            <a href="bounties.php">Bounties</a>
            <a href="index.php?logout=1">Logout</a>
        </nav>
    </div>
    <div class="main">
        <header>
            <h1>Dashboard</h1>
            <p>Platform overview and key metrics</p>
        </header>
        <div class="stats">
            <div class="stat-card"><h3>Total Users</h3><div class="value"><?= $stats['total_users'] ?></div></div>
            <div class="stat-card"><h3>Active Bounties</h3><div class="value"><?= $stats['active_bounties'] ?></div></div>
            <div class="stat-card"><h3>Total Submissions</h3><div class="value"><?= $stats['total_submissions'] ?></div></div>
            <div class="stat-card"><h3>Pending Reviews</h3><div class="value"><?= $stats['pending_reviews'] ?></div></div>
            <div class="stat-card"><h3>Flagged Listings</h3><div class="value"><?= $stats['flagged_listings'] ?></div></div>
            <div class="stat-card"><h3>Open Disputes</h3><div class="value"><?= $stats['open_disputes'] ?></div></div>
            <div class="stat-card"><h3>Revenue (Month)</h3><div class="value"><?= $stats['revenue_month'] ?></div></div>
            <div class="stat-card"><h3>New Users Today</h3><div class="value"><?= $stats['new_users_today'] ?></div></div>
        </div>
        <header><h2>Recent Submissions</h2></header>
        <table>
            <thead><tr><th>User</th><th>Bounty</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
                <tr><td>alice_dev</td><td>Fix XSS in login form</td><td><span class="badge open">Pending</span></td><td>2026-05-20</td></tr>
                <tr><td>bob_coder</td><td>Add input validation</td><td><span class="badge active">Approved</span></td><td>2026-05-19</td></tr>
                <tr><td>charlie_sec</td><td>Rate limiting middleware</td><td><span class="badge resolved">Merged</span></td><td>2026-05-18</td></tr>
                <tr><td>diana_hack</td><td>CSRF protection</td><td><span class="badge open">Pending</span></td><td>2026-05-17</td></tr>
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
