// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract VLDStaking {
    IERC20 public vldToken;
    address public owner;
    uint256 public rewardRatePerDay = 13698; // Default: 5M VLD / 365 giorni
    uint256 public lockPeriod = 30 days;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaim;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    // ========== Events ==========
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event ContractFunded(uint256 amount);
    event RewardRateChanged(uint256 newRate);
    event LockPeriodChanged(uint256 newPeriod);
    event TokensRecovered(address token, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo l'owner puo' eseguire questa azione");
        _;
    }

    constructor(address _vldTokenAddress) {
        vldToken = IERC20(_vldTokenAddress);
        owner = msg.sender;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Importo non valido");

        StakeInfo storage user = stakes[msg.sender];

        // Prima di aumentare la posta, calcolo e distribuisco eventuale reward
        _claimReward(msg.sender);

        require(vldToken.transferFrom(msg.sender, address(this), amount), "TransferFrom fallita");

        if (user.amount == 0) {
            user.startTime = block.timestamp;
            user.lastClaim = block.timestamp;
        }

        user.amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake() external {
        StakeInfo storage user = stakes[msg.sender];
        require(user.amount > 0, "Nessuno stake trovato");
        require(block.timestamp >= user.startTime + lockPeriod, "Periodo di lock non ancora scaduto");

        _claimReward(msg.sender);

        uint256 amount = user.amount;
        user.amount = 0;
        user.startTime = 0;
        user.lastClaim = 0;
        totalStaked -= amount;

        require(vldToken.transfer(msg.sender, amount), "Transfer fallita");
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external {
        uint256 reward = _claimReward(msg.sender);
        require(reward > 0, "Nessuna reward disponibile");
    }

    function _claimReward(address userAddress) internal returns (uint256 rewardClaimed) {
        StakeInfo storage user = stakes[userAddress];
        if (user.amount == 0 || totalStaked == 0) return 0;

        uint256 elapsedDays = (block.timestamp - user.lastClaim) / 1 days;
        if (elapsedDays == 0) return 0;

        uint256 userReward = (user.amount * rewardRatePerDay * elapsedDays) / totalStaked;

        // Aggiorna sempre lastClaim, anche se non ci sono abbastanza fondi
        user.lastClaim = block.timestamp;

        if (userReward > 0 && vldToken.balanceOf(address(this)) >= userReward) {
            vldToken.transfer(userAddress, userReward);
            emit RewardClaimed(userAddress, userReward);
            return userReward;
        }

        return 0;
    }

    function getPendingReward(address userAddress) external view returns (uint256) {
        StakeInfo storage user = stakes[userAddress];
        if (user.amount == 0 || totalStaked == 0) return 0;

        uint256 elapsedDays = (block.timestamp - user.lastClaim) / 1 days;
        if (elapsedDays == 0) return 0;

        uint256 userReward = (user.amount * rewardRatePerDay * elapsedDays) / totalStaked;
        return userReward;
    }

    function fundContract(uint256 amount) external onlyOwner {
        require(vldToken.transferFrom(msg.sender, address(this), amount), "TransferFrom fallita");
        emit ContractFunded(amount);
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerDay = newRate;
        emit RewardRateChanged(newRate);
    }

    function setLockPeriod(uint256 newLock) external onlyOwner {
        lockPeriod = newLock;
        emit LockPeriodChanged(newLock);
    }

    function recoverTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Token address non valido");
        require(IERC20(tokenAddress).transfer(msg.sender, amount), "Recupero fallito");
        emit TokensRecovered(tokenAddress, amount);
    }
}
