const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
  return db.users.findUnique({ where: { id } });
};

export const updatePayoutPreferences = async (userId, method, details) => {
  const allowedMethods = ['USDT_TRC20', 'BINANCE', 'PAYPAL', 'WIRE_TRANSFER'];
  if (!allowedMethods.includes(method)) {
    throw new Error('Invalid payout method');
  }
  
  const user = await db.users.update({
    where: { id: userId },
    data: { alternativePayoutMethod: method, alternativePayoutDetails: details }
  });
  return user;
};

export const updateUserProfile = async (userId, data) => {
