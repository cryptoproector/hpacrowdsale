const BigNumber = require('bignumber.js');

//import abi from '../build/contracts/HighlyProfitableAnonymousToken.json'
const hpa = artifacts.require("HPACrowdsale");
const hpaCoin = artifacts.require("HighlyProfitableAnonymousToken");


//const BigNumber = web3.BigNumber;
contract("HPACrowdsale", accounts => {
	let owner = accounts[0];
	let firstAcc = accounts[5];
	it("Check ether transaction", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		console.log("First transaction:");
		let eth5 = new BigNumber(10 * 10**13);
		//let eth5 = web3.utils.toWei('20', 'szabo');
		//let balance = await sale.getBalance.call(accounts[0]);

		await sale.sendTransaction({from: firstAcc, value: eth5});

		let balance5 = await token.balanceOf(firstAcc);
		let rate = await sale.rate();
		let calcBalance = new BigNumber(rate.valueOf()).mul(eth5);
		if (balance5==calcBalance.toNumber()) {
			console.log("\tSpanding:"+(new BigNumber(eth5).div(10**18).toNumber())+"ETH, Buying:"+calcBalance.div(10**18).toNumber());
		}
		assert.equal(balance5, calcBalance.toNumber(), balance5+" != "+calcBalance.toNumber());
	  });

	for (let s=1; s<7; s++){
		it("Check stage "+s+" complete", async () => {
			let sale = await hpa.deployed();
			let tokenAddress = await sale.token();
			let token = await hpaCoin.at(tokenAddress);

			let ethSend;
			if (s===1)
				ethSend = new BigNumber(10 * 10**13);
			else if (s===2)
				ethSend = new BigNumber(5 * 10**15);
			else if (s===3)
				ethSend = new BigNumber(25 * 10**16);
			else if (s===4)
				ethSend = new BigNumber(5 * 10**17);
			else if (s===5)
				ethSend = new BigNumber(10**18 * 10);
			else if (s===6)
				ethSend = new BigNumber(10**18 * 100);

			let oldStage = await sale.currentStage();
			let rate = await sale.rate();
			let stageParam = await sale.viewStage(s);
			oldStage = oldStage.toNumber();
			let acc = 6;
			let stageStat;
			let priceUnsoldTokens;
			let curStage = oldStage;
			console.log("Stage №"+curStage+" transaction:");
			while (curStage == oldStage) {
				stageStat = await sale.viewStageStat(curStage);
				let oldStageStat = stageStat;
				priceUnsoldTokens = new BigNumber(stageStat[2]).div(rate.valueOf());
				if (new BigNumber(priceUnsoldTokens).lt(ethSend)) {
					ethSend = new BigNumber(priceUnsoldTokens);
				}
				let refererBeginHpaBalance = await token.balanceOf(accounts[acc-1]);
				let buyerBeginHpaBalance = await token.balanceOf(accounts[acc]);
				let refererBeginEthBalance = await web3.eth.getBalance(accounts[acc-1]);
				let buyerBeginEthBalance = await web3.eth.getBalance(accounts[acc]);
				let refererBeginInfo = await sale.getMyInfo({from:accounts[acc-1]});
				let buyerBeginInfo = await sale.getMyInfo({from:accounts[acc]});
				/*console.log("\tReferer begin INFO:");
				console.log(
					"\t\tHPA: " + new BigNumber(refererBeginHpaBalance).div(10**18)+", "+
					"\tETH: " + new BigNumber(refererBeginEthBalance).div(10**18)+", "
				);*/
				/*console.log("\tBuyer begin INFO:");
				console.log(
					"\t\tHPA: " + new BigNumber(buyerBeginHpaBalance).div(10**18)+", "+
					"\tETH: " + new BigNumber(buyerBeginEthBalance).div(10**18)+", "
				);*/
				//console.log("\tBuyer Info Array: ");
				//console.log(buyerBeginInfo);
				//console.log("\t\tBuyer begin Stage Part Dist Info: ");
				//console.log(buyerBeginStagePartDistInfo);
				const receipt = await sale.sendTransaction({from: accounts[acc], value: ethSend, data: accounts[acc-1]});
				const gasUsed = receipt.receipt.gasUsed;
				const tx = await web3.eth.getTransaction(receipt.tx);
				const gasPrice = tx.gasPrice;

				let refererEndHpaBalance = await token.balanceOf(accounts[acc-1]);
				let buyerEndHpaBalance = await token.balanceOf(accounts[acc]);
				let refererEndEthBalance = await web3.eth.getBalance(accounts[acc-1]);
				let buyerEndEthBalance = await web3.eth.getBalance(accounts[acc]);
				let refererEndInfo = await sale.getMyInfo({from:accounts[acc-1]});
				let buyerEndInfo = await sale.getMyInfo({from:accounts[acc]});
				let purchase = buyerEndInfo[3][buyerEndInfo[3].length-1];
				let buyerEndStagePartDistInfo = await sale.getBuyerStagePartDistInfo(curStage,accounts[acc]);
				let arrReferrals = refererEndInfo[1];
				let referralIsSet = false;
				let referralInfo = [];
				arrReferrals.forEach(function(entry) {
					if (entry['referral'] == accounts[acc]) {
						referralIsSet = true;
						referralInfo = entry;
					}
				});

				/*console.log("\tReferer end INFO:");
				console.log(
					"\t\tHPA: " + new BigNumber(refererEndHpaBalance).div(10**18)+", "+
					"\tETH: " + new BigNumber(refererEndEthBalance).div(10**18)+", "
				);*/
				/*console.log("\tBuyer end INFO:");
				console.log(
					"\t\tHPA: " + new BigNumber(buyerEndHpaBalance).div(10**18)+", "+
					"\tETH: " + new BigNumber(buyerEndEthBalance).div(10**18)+", "
				);*/
				//console.log("\tReferer end Array: ");
				//console.log(refererEndInfo);
				//console.log("\t\tBuyer end Stage Part Dist Info: ");
				//console.log(buyerEndStagePartDistInfo);
				acc++;
				stageStat = await sale.viewStageStat(curStage);
				let tokenSold = new BigNumber(ethSend).mul(rate);

				assert.equal(
					new BigNumber(refererBeginHpaBalance).add(new BigNumber(tokenSold).mul(stageParam[2]).div(100)).toString(),
					new BigNumber(refererEndHpaBalance).toString(),
					"Referer HPA balance not found"
				);
				assert.equal(
					new BigNumber(refererBeginEthBalance).add(new BigNumber(ethSend).mul(10).div(100)).toString(),
					new BigNumber(refererEndEthBalance).toString(),
					"Referer ETH balance not found"
				);
				assert.equal(new BigNumber(buyerBeginHpaBalance).add(tokenSold).toString(), new BigNumber(buyerEndHpaBalance).toString(), "Buyer HPA balance not found");
				assert.equal(new BigNumber(buyerBeginEthBalance).sub(ethSend).sub(new BigNumber(gasPrice).mul(gasUsed)).toString(), new BigNumber(buyerEndEthBalance).toString(), "Buyer ETH balance not found");
				assert.equal(new BigNumber(refererBeginInfo[0]).add(1).toString(), new BigNumber(refererEndInfo[0]).toString(), "Number referrals not found");
				assert.ok(referralIsSet, "Referral not found");
				assert.equal(new BigNumber(referralInfo['referralSum']).toString(), new BigNumber(tokenSold).mul(stageParam[2]).div(100).toString(), "Referral statistics HPA sum not found");
				assert.equal(new BigNumber(referralInfo['referralEth']).toString(), new BigNumber(ethSend).mul(10).div(100).toString(), "Referral statistics ETH sum not found");
				assert.equal(new BigNumber(buyerBeginInfo[2]).add(1).toString(), new BigNumber(buyerEndInfo[2]).toString(), "Buyer number purchases not found");
				assert.equal(purchase['stage'], curStage, "Buyer statistic stage not found");
				assert.equal(new BigNumber(purchase['price']).toString(), new BigNumber(10**18).div(rate).toString(), "Buyer statistic price not found");
				assert.equal(new BigNumber(purchase['sumEth']).toString(), new BigNumber(ethSend).toString(), "Buyer statistic sum ETH not found");
				assert.equal(new BigNumber(purchase['sumHpa']).toString(), new BigNumber(tokenSold).toString(), "Buyer statistic sum HPA not found");
				assert.equal(new BigNumber(buyerEndStagePartDistInfo[0]).toNumber(), 0, "Buyer sumWei > 0 in StagePartDistInfo in Stage "+curStage);
				assert.equal(new BigNumber(buyerEndStagePartDistInfo[1]).toNumber(), 0, "Buyer sumHpa > 0 in StagePartDistInfo in Stage "+curStage);
				assert.ok(typeof buyerEndStagePartDistInfo[2] == "undefined" || !buyerEndStagePartDistInfo[2], "Buyer part === true in StagePartDistInfo in Stage "+curStage);

				assert.equal(new BigNumber(stageStat[0]).toString(), new BigNumber(oldStageStat[0]).add(tokenSold).toString(), "Statistic stage "+curStage+": token sold statistic not found");
				assert.equal(new BigNumber(stageStat[1]).toString(), new BigNumber(oldStageStat[1]).add(1).toString(), "Statistic stage "+curStage+": number purchases statistic not found");
				assert.equal(new BigNumber(stageStat[2]).toString(), new BigNumber(oldStageStat[2]).sub(tokenSold).toString(), "Statistic stage "+curStage+": token unsold statistic not found");
				assert.equal(new BigNumber(stageStat[3]).toNumber(), 0, "Statistic stage "+curStage+": number buyers for distribution tokens > 0");
				assert.equal(new BigNumber(stageStat[4]).toString(), new BigNumber(oldStageStat[4]).toString(), "Statistic stage "+curStage+": stage start time has changed");
				//assert.equal(new BigNumber(stageStat[2]).toNumber(), 0, "Statistic stage "+curStage+": stage end time > 0");
				console.log(
					"\t№"+stageStat[1]+": "+
					"\tETH:"+new BigNumber(ethSend).div(10**18)+", "+
					"\tHPA:"+tokenSold.div(10**18)+", "+
					"\tTokens Sold: "+new BigNumber(stageStat[0]).div(10**18)+", "+
					"\tTokens Unsold: "+new BigNumber(stageStat[2]).div(10**18)
				);
				curStage = await sale.currentStage();
				curStage = curStage.toNumber();
				if (acc==99) acc=6;
			}
			stageStat = await sale.viewStageStat(curStage);
			console.log(
				"\tNext stage: "+curStage+", "
			);
			assert.equal(curStage, oldStage + 1, "Stage "+curStage+" not complete");
		}).timeout(30000000);
	}

	for (let s=7; s<=14; s++){
		it("Check timing stage "+s+" complete", async () => {
			let sale = await hpa.deployed();
			let tokenAddress = await sale.token();
			let token = await hpaCoin.at(tokenAddress);

			let curStage = await sale.currentStage();
			let rate = await sale.rate();
			curStage = curStage.toNumber();
			let acc = 6;
			let stageStat;
			let priceUnsoldTokens;
			let oldStage = curStage;
			let stageParam = await sale.viewStage(s);
			//let ethSend = new BigNumber(web3.utils.toWei('100', 'szabo')).mul(10**s);
			let ethSend = new BigNumber(10**18).toString();
			let distBuyer = 0;
			if (new BigNumber(stageParam[4]).gt(0)) {
				ethSend = new BigNumber(stageParam[4]).mul(10);
				//ethSend = new BigNumber(ethSend).toString();
			}
			console.log("Stage №"+curStage+" transaction:");
			let numTx = 20;
			/*if (s===8)
				numTx = 40;
			else if (s===9)
				numTx = 290;
			else if (s===10)
				numTx = 240;
			else if (s===11)
				numTx = 420;
			else if (s===12)
				numTx = 420;
			else if (s===13)
				numTx = 670;
			else if (s===14)
				numTx = 500;*/

			for(let i=0; i<numTx; i++) {
				stageStat = await sale.viewStageStat(curStage);
				let oldStageStat = stageStat;
				priceUnsoldTokens = new BigNumber(stageStat[2]).div(rate.valueOf());
				if (new BigNumber(priceUnsoldTokens).lt(ethSend)) {
					ethSend = new BigNumber(priceUnsoldTokens).toString();
				}
				let checkBuyerPartDistInfo = false;
				let buyerBeginStagePartDistInfo = await sale.getBuyerStagePartDistInfo(curStage,accounts[acc]);
				if (new BigNumber(ethSend).gte(stageParam[4])) {
					if (new BigNumber(stageParam[4]).gt(0)) {
						checkBuyerPartDistInfo = true;
						if (new BigNumber(buyerBeginStagePartDistInfo[1]).equals(0)) distBuyer++;
					}
				}

				let refererBeginHpaBalance = await token.balanceOf(accounts[acc-1]);
				let buyerBeginHpaBalance = await token.balanceOf(accounts[acc]);
				let refererBeginEthBalance = await web3.eth.getBalance(accounts[acc-1]);
				let buyerBeginEthBalance = await web3.eth.getBalance(accounts[acc]);
				let refererBeginInfo = await sale.getMyInfo({from:accounts[acc-1]});
				let buyerBeginInfo = await sale.getMyInfo({from:accounts[acc]});
				//console.log("\tReferer begin INFO:");
				//console.log(
				//	"\t\tHPA: " + new BigNumber(refererBeginHpaBalance).div(10**18)+", "+
				//	"\tETH: " + new BigNumber(refererBeginEthBalance).div(10**18)+", "
				//);
				//console.log("\tBuyer begin INFO:");
				//console.log(
				//	"\t\tHPA: " + new BigNumber(buyerBeginHpaBalance).div(10**18)+", "+
				//	"\tETH: " + new BigNumber(buyerBeginEthBalance).div(10**18)+", "
				//);
				//console.log("\tBuyer Info Array: ");
				//console.log(buyerBeginInfo);
				//console.log("\t\tBuyer begin Stage Part Dist Info: ");
				//console.log(buyerBeginStagePartDistInfo);
				const receipt = await sale.sendTransaction({from: accounts[acc], value: ethSend, data: accounts[acc-1]});
				const gasUsed = receipt.receipt.gasUsed;
				const tx = await web3.eth.getTransaction(receipt.tx);
				const gasPrice = tx.gasPrice;

				let refererEndHpaBalance = await token.balanceOf(accounts[acc-1]);
				let buyerEndHpaBalance = await token.balanceOf(accounts[acc]);
				let refererEndEthBalance = await web3.eth.getBalance(accounts[acc-1]);
				let buyerEndEthBalance = await web3.eth.getBalance(accounts[acc]);
				let refererEndInfo = await sale.getMyInfo({from:accounts[acc-1]});
				let buyerEndInfo = await sale.getMyInfo({from:accounts[acc]});
				let purchase = buyerEndInfo[3][buyerEndInfo[3].length-1];
				let buyerEndStagePartDistInfo = await sale.getBuyerStagePartDistInfo(curStage,accounts[acc]);
				let arrReferrals = refererEndInfo[1];
				let referralIsSet = false;
				let referralInfo = [];
				arrReferrals.forEach(function(entry) {
					if (entry['referral'] == accounts[acc]) {
						referralIsSet = true;
						referralInfo = entry;
					}
				});

				//console.log("\tReferer end INFO:");
				//console.log(
				//	"\t\tHPA: " + new BigNumber(refererEndHpaBalance).div(10**18)+", "+
				//	"\tETH: " + new BigNumber(refererEndEthBalance).div(10**18)+", "
				//);
				//console.log("\tBuyer end INFO:");
				//console.log(
				//	"\t\tHPA: " + new BigNumber(buyerEndHpaBalance).div(10**18)+", "+
				//	"\tETH: " + new BigNumber(buyerEndEthBalance).div(10**18)+", "
				//);
				//console.log("\tReferer end Array: ");
				//console.log(refererEndInfo);
				//console.log("\t\tBuyer end Stage Part Dist Info: ");
				//console.log(buyerEndStagePartDistInfo);

				acc++;
				stageStat = await sale.viewStageStat(curStage);
				let tokenSold = new BigNumber(ethSend).mul(rate);

				assert.equal(
					new BigNumber(refererBeginHpaBalance).add(new BigNumber(tokenSold).mul(stageParam[2]).div(100)).toString(),
					new BigNumber(refererEndHpaBalance).toString(),
					"Referer HPA balance not found"
				);
				assert.equal(
					new BigNumber(refererBeginEthBalance).add(new BigNumber(ethSend).mul(10).div(100)).toString(),
					new BigNumber(refererEndEthBalance).toString(),
					"Referer ETH balance not found"
				);
				assert.equal(new BigNumber(buyerBeginHpaBalance).add(tokenSold).toString(), new BigNumber(buyerEndHpaBalance).toString(), "Buyer HPA balance not found");
				assert.equal(new BigNumber(buyerBeginEthBalance).sub(ethSend).sub(new BigNumber(gasPrice).mul(gasUsed)).toString(), new BigNumber(buyerEndEthBalance).toString(), "Buyer ETH balance not found");
				assert.equal(new BigNumber(refererBeginInfo[0]).add(1).toString(), new BigNumber(refererEndInfo[0]).toString(), "Number referrals not found");
				assert.ok(referralIsSet, "Referral not found");
				assert.equal(new BigNumber(referralInfo['referralSum']).toString(), new BigNumber(tokenSold).mul(stageParam[2]).div(100).toString(), "Referral statistics HPA sum not found");
				assert.equal(new BigNumber(referralInfo['referralEth']).toString(), new BigNumber(ethSend).mul(10).div(100).toString(), "Referral statistics ETH sum not found");
				assert.equal(new BigNumber(buyerBeginInfo[2]).add(1).toString(), new BigNumber(buyerEndInfo[2]).toString(), "Buyer number purchases not found");
				assert.equal(purchase['stage'], curStage, "Buyer statistic stage not found");
				assert.equal(new BigNumber(purchase['price']).toString(), new BigNumber(10**18).div(rate).floor().toString(), "Buyer statistic price not found");
				assert.equal(new BigNumber(purchase['sumEth']).toString(), new BigNumber(ethSend).toString(), "Buyer statistic sum ETH not found");
				assert.equal(new BigNumber(purchase['sumHpa']).toString(), new BigNumber(tokenSold).toString(), "Buyer statistic sum HPA not found");
				if (checkBuyerPartDistInfo) {
					assert.equal(new BigNumber(buyerEndStagePartDistInfo[0]).toString(), new BigNumber(buyerBeginStagePartDistInfo[0]).add(ethSend).toString(), "Buyer sumWei not found in StagePartDistInfo in Stage "+curStage);
					assert.equal(new BigNumber(buyerEndStagePartDistInfo[1]).toString(), new BigNumber(buyerBeginStagePartDistInfo[1]).add(tokenSold).toString(), "Buyer sumHpa not found in StagePartDistInfo in Stage "+curStage);
					assert.ok(!!buyerEndStagePartDistInfo[2], "Buyer part not found in StagePartDistInfo in Stage "+curStage);
				}

				assert.equal(new BigNumber(stageStat[0]).toString(), new BigNumber(oldStageStat[0]).add(tokenSold).toString(), "Statistic stage "+curStage+": token sold statistic not found");
				assert.equal(new BigNumber(stageStat[1]).toString(), new BigNumber(oldStageStat[1]).add(1).toString(), "Statistic stage "+curStage+": number purchases statistic not found");
				assert.equal(new BigNumber(stageStat[2]).toString(), new BigNumber(oldStageStat[2]).sub(tokenSold).toString(), "Statistic stage "+curStage+": token unsold statistic not found");
				//console.log("In stat:" + new BigNumber(stageStat[3]).toNumber());
				//console.log("In js:" + distBuyer);
				assert.equal(new BigNumber(stageStat[3]).toNumber(), distBuyer, "Statistic stage "+curStage+": number buyers for distribution tokens not found");
				assert.equal(new BigNumber(stageStat[4]).toString(), new BigNumber(oldStageStat[4]).toString(), "Statistic stage "+curStage+": stage start time has changed");
				//assert.equal(new BigNumber(stageStat[2]).toNumber(), 0, "Statistic stage "+curStage+": stage end time > 0");
				console.log(
					"\t№"+stageStat[1]+": "+
					"\tETH:"+new BigNumber(ethSend).div(10**18)+", "+
					"\tHPA:"+new BigNumber(ethSend).mul(rate).div(10**18)+", "+
					"\tTokens Sold: "+new BigNumber(stageStat[0]).div(10**18)+", "+
					"\tTokens Unsold: "+new BigNumber(stageStat[2]).div(10**18)
				);
				curStage = await sale.currentStage();
				curStage = curStage.toNumber();
				if (acc==99) acc=6;
			}
			await new Promise((resolve, reject) =>
				web3.currentProvider.send({
					jsonrpc: "2.0",
					method: "evm_increaseTime",
					params: [10 * 60 * 60 * 24],
					id: new Date().getTime()
				}, (error, result) => error ? reject(error) : resolve(result.result))
			);
			console.log("\tIncrease time on 10 days");
			await sale.manualyCloseCurrentStage({from: owner}).then(function(result) {
				assert.ok(result.receipt.status, "Stage "+curStage+" not closed. Transaction manualyCloseCurrentStage() not Complete");
			});

			let oldStageStat = await sale.viewStageStat(oldStage);
			if (oldStage===14) {
				assert.ok(oldStageStat[5]>0, "Stage "+oldStage+" not complete");
				console.log("\tAll stages complete");
			} else {
				curStage = await sale.currentStage();
				stageStat = await sale.viewStageStat(curStage);
				console.log(
					"\tNext stage: "+curStage+", "
				);
				assert.equal(curStage, oldStage + 1, "Stage "+oldStage+" not complete");
				assert.ok(oldStageStat[5]>0, "Stage "+oldStage+" not complete");
			}
		}).timeout(30000000);
	};

	it("Check calculation distribution unsold token on crowdsale", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		await sale.distCalc({from: owner}).then(function(result) {
			assert.ok(result.receipt.status, "Calculation transaction return false");
		});
		let allUnsoldTokens = 0;
		console.log("Calculate distribution unsold token:");
		for (s=1;s<=14;s++) {
			let stageParam = await sale.viewStage(s);
			//console.log("Stage percent: "+stageParam[3]);
			//if (stageParam[3] > 0) {
				let stageStat = await sale.viewStageStat(s);
				console.log("\tStage №"+s+" unsold tokens: "+new BigNumber(stageStat[2]).div(10**18));
				allUnsoldTokens = new BigNumber(stageStat[2].valueOf()).add(allUnsoldTokens);
				//console.log("All unsold tokens: "+allUnsoldTokens.toString());
			//}
		}
		let contractCalcUnsoldTokens = await sale.getUnsoldTokens();
		console.log("\n\tAll unsold tokens: "+new BigNumber(contractCalcUnsoldTokens).div(10**18))+"\n";
		//console.log("Contract calculation unsold token: "+contractCalcUnsoldTokens);
		contractCalcUnsoldTokens = new BigNumber(contractCalcUnsoldTokens.valueOf());
		allUnsoldTokens = new BigNumber(allUnsoldTokens);
		assert.equal(contractCalcUnsoldTokens.toNumber(), allUnsoldTokens.toNumber(), "Calculation distribution unsold token not right!");
		for (s=1;s<=14;s++) {
			let stageParam = await sale.viewStage(s);
			if (stageParam[3] > 0) {
				let stageDistTokens = await sale.viewStageDistTokens(s);
				assert.equal(stageParam[3].toNumber(),stageDistTokens[0].toNumber(), "Percent not equal "+s+" stage percent");
				let stageUnsoldTokens = new BigNumber(allUnsoldTokens).div(100).mul(stageDistTokens[0]);
				//console.log("Dist tokens on stage "+s+": "+new BigNumber(stageUnsoldTokens).toString());
				assert.equal(new BigNumber(stageUnsoldTokens).toString(), new BigNumber(stageDistTokens[1]).toString(), "Calculation on stage "+s+" distribution unsold token not right!");
				let stageStat = await sale.viewStageStat(s);

				let distTokens = new BigNumber(stageUnsoldTokens).div(stageStat[3]);
				assert.equal(new BigNumber(distTokens).round(21).toNumber(), new BigNumber(stageDistTokens[2]).round(21).toNumber(), "Calculation on stage "+s+" distribution unsold token for ONE BUYER not right!");
				//console.log("Dist tokens for One Buyer on stage "+s+": "+new BigNumber(distTokens).toString());
				console.log(
					"\tStage №"+s+": "+
					"\tPercent: "+stageDistTokens[0].toNumber()+", "+
					"\tTokens for distribution: "+new BigNumber(stageDistTokens[1]).div(10**18)+", "+
					"\tTokens for one buyer: "+new BigNumber(stageDistTokens[2]).div(10**18)
				);
			}
		}
	});

	it("Check calculation buyback price", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		await sale.buybackCalc({from: owner}).then(function(result) {
			assert.ok(result.receipt.status, "Calculation transaction return false");
		});

		console.log("Calculation buyback price:");
		let contractBalance = await web3.eth.getBalance(sale.address);
		let totalSupply = await token.totalSupply();
		totalSupply = new BigNumber(new BigNumber(totalSupply.valueOf()).div(10**19)).floor(0);
		//console.log(totalSupply);
		let buybackPrice = new BigNumber(contractBalance).div(totalSupply).floor(0);
		let contractCalcBuybackPrice = await sale.getBuybackPrice();
		contractCalcBuybackPrice = new BigNumber(contractCalcBuybackPrice);
		//console.log(contractCalcBuybackPrice);
		buybackPrice = new BigNumber(buybackPrice);
		console.log("\tContract balance: "+new BigNumber(contractBalance).div(10**18));
		console.log("\tBuyback price: "+new BigNumber(buybackPrice).div(10**18));
		assert.equal(buybackPrice.toString(), contractCalcBuybackPrice.toString(), "Calculation buyback price not right!");
	});

	it("Requests all unsold tokens", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		for (let n=0;n<100;n++) {
			let tokensForAccount = 0;
			let msgTokensDist = "";
			let beginTokenBalance = await token.balanceOf(accounts[n]);
			console.log("\taccount "+n+" ("+accounts[n]+") before request token balance: \t"+new BigNumber(beginTokenBalance).div(10**18).toNumber());

			for (let s=1; s<=14; s++) {
				let buyerStagePartDistInfo = await sale.getBuyerStagePartDistInfo(s,accounts[n]);
				let stageSendToken = 0;
				if (buyerStagePartDistInfo[2]) {
					let stageParam = await sale.viewStage(s);
					if (stageParam[3] > 0) {
						let stageDistTokens = await sale.viewStageDistTokens(s);
						stageSendToken = stageDistTokens[2];
					}
					tokensForAccount = new BigNumber(tokensForAccount).add(stageSendToken);
				}
				msgTokensDist += "\tstage "+s+": "+new BigNumber(stageSendToken).div(10**18);
			}
			console.log(msgTokensDist);
			console.log("\tAll unsold tokens for account: "+new BigNumber(tokensForAccount).div(10**18));

			let beginDistTokens = await sale.getDistTokens();
			await sale.withdrawalUnsoldTokens(accounts[n], {from: accounts[n]});
			let accountCollectedUnsoldTokens = await sale.getBuyerCollectedUnsoldTokens(accounts[n]);
			let endDistTokens = await sale.getDistTokens();
			assert.equal(new BigNumber(beginDistTokens).add(tokensForAccount).toString(), new BigNumber(endDistTokens).toString(), "Invalid DistTokens");
			assert.equal(new BigNumber(accountCollectedUnsoldTokens).toString(), new BigNumber(tokensForAccount).toString(), "Invalid buyer collected unsold tokens");
			let endTokenBalance = await token.balanceOf(accounts[n]);
			console.log("\taccount "+n+" ("+accounts[n]+") after request token balance: \t"+new BigNumber(endTokenBalance).div(10**18).toNumber()+"\n");
			assert.equal(new BigNumber(endTokenBalance).toString(), new BigNumber(beginTokenBalance).add(tokensForAccount).toString(), "Distributions unsold tokens for account №"+n+" not found!");
		}
	});

	it("Request buyback", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		console.log("Request buyback:");
		let tokensAmount = web3.utils.toWei("1000", "ether");
		let beginHpaBalance = await token.balanceOf(accounts[7]);
		console.log("\tBegin account HPA balance: "+new BigNumber(beginHpaBalance).div(10**18));
		let beginContractBalance = await web3.eth.getBalance(sale.address);
		console.log("\tBegin contract ETH balance: "+new BigNumber(beginContractBalance).div(10**18));
		let beginEthBalance = await web3.eth.getBalance(accounts[8]);
		console.log("\tBegin account ETH balance: "+new BigNumber(beginEthBalance).div(10**18));
		let beginBalanceBuyback = await sale.getBuybackBalance();
		await token.approve(sale.address, tokensAmount, {from: accounts[7]}).then(function (result,error) {
			//console.log('approve error:');
			//console.log(error);
			//console.log('approve result');
			//console.log(result);
		});
		await sale.buyback(accounts[8], tokensAmount, {from: accounts[7]}).then(function (result,error) {
			//console.log('buyback error:');
			//console.log(error);
			//console.log('buyback result');
			//console.log(result);
		});

		let statBuyerBuybacks = await sale.getBuyerBuybacks(accounts[7]);
		let endBalanceBuyback = await sale.getBuybackBalance();

		let endHpaBalance = await token.balanceOf(accounts[7]);
		console.log("\tEnd account HPA balance: "+new BigNumber(endHpaBalance).div(10**18));
		let endContractBalance = await web3.eth.getBalance(sale.address);
		console.log("\tEnd contract ETH balance: "+new BigNumber(endContractBalance).div(10**18));
		let endEthBalance = await web3.eth.getBalance(accounts[8]);
		console.log("\tEnd account ETH balance: "+new BigNumber(endEthBalance).div(10**18));

		let contractCalcBuybackPrice = await sale.getBuybackPrice();
		console.log("\tTokens price: "+new BigNumber(contractCalcBuybackPrice).div(10**18));

		let sumEthTrx = new BigNumber(tokensAmount).div(10**18).mul(contractCalcBuybackPrice);

		assert.equal(new BigNumber(beginBalanceBuyback).sub(sumEthTrx).toString(), new BigNumber(endBalanceBuyback).toString(), "Invalid balance buyback");
		assert.equal(statBuyerBuybacks[0]['beneficiary'],accounts[8], "Statistic buyback: invalid beneficiary");
		assert.equal(new BigNumber(statBuyerBuybacks[0]['tokenAmount']).toString(),new BigNumber(tokensAmount).toString(), "Statistic buyback: invalid token amount");
		assert.equal(new BigNumber(statBuyerBuybacks[0]['price']).toString(),new BigNumber(contractCalcBuybackPrice).toString(), "Statistic buyback: invalid price");
		assert.equal(new BigNumber(statBuyerBuybacks[0]['sumEther']).toString(),new BigNumber(sumEthTrx).toString(), "Statistic buyback: invalid ETH amount");
		assert.equal(new BigNumber(beginHpaBalance).sub(tokensAmount).toString(), new BigNumber(endHpaBalance).toString(), "Invalid token balance after buyback request");
		assert.equal(new BigNumber(beginEthBalance).add(sumEthTrx).toString(), new BigNumber(endEthBalance).toString(), "Invalid wallet ether balance after request for buyback");
		assert.equal(new BigNumber(beginContractBalance).sub(sumEthTrx).toString(), new BigNumber(endContractBalance).toString(), "Invalid contract ether balance after request for buyback");
	});

	it("Request withdrawal", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		console.log("Request withdrawal:");
		await new Promise((resolve, reject) =>
			web3.currentProvider.send({
				jsonrpc: "2.0",
				method: "evm_increaseTime",
				params: [180 * 60 * 60 * 24],
				id: new Date().getTime()
			}, (error, result) => error ? reject(error) : resolve(result.result))
		);

		let beginContractBalance = await web3.eth.getBalance(sale.address);
		console.log("\tBegin contract ETH balance: "+new BigNumber(beginContractBalance).div(10**18));
		let beginEthBalance = await web3.eth.getBalance(accounts[1]);
		console.log("\tBegin account ETH balance: "+new BigNumber(beginEthBalance).div(10**18));
		await sale.withdrawal(accounts[1], {from: accounts[0]}).then(function (result,error) {
			//console.log('buyback error:');
			//console.log(error);
			//console.log('buyback result');
			//console.log(result);
		});
		let endContractBalance = await web3.eth.getBalance(sale.address);
		console.log("\tEnd contract ETH balance: "+new BigNumber(endContractBalance).div(10**18));
		let endEthBalance = await web3.eth.getBalance(accounts[1]);
		console.log("\tEnd account ETH balance: "+new BigNumber(endEthBalance).div(10**18));

		assert.equal(new BigNumber(beginEthBalance).add(beginContractBalance).toString(), new BigNumber(endEthBalance).toString(), "Invalid wallet ether balance after withdrawal request");
		assert.equal(new BigNumber(0).toString(), new BigNumber(endContractBalance).toString(), "Invalid contract ether balance after withdrawal request");
	});

	it("Test token transaction", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		console.log("Test token transaction:");
		// Initial balance of the second account
		const initialHpaBalance7 = await token.balanceOf(accounts[7]);
		const initialHpaBalance8 = await token.balanceOf(accounts[8]);
		const initialEthBalance7 = await web3.eth.getBalance(accounts[7]);
		const initialEthBalance8 = await web3.eth.getBalance(accounts[8]);
		console.log(
			'\tInitial HPA token balance (account 7): ' + new BigNumber(initialHpaBalance7).div(10**18).toString() + ', ' +
			'\tETH balance: ' + new BigNumber(initialEthBalance7).div(10**18).toString()
		);
		console.log(
			'\tInitial HPA token balance (account 8): ' + new BigNumber(initialHpaBalance8).div(10**18).toString() + ', ' +
			'\tETH balance: ' + new BigNumber(initialEthBalance8).div(10**18).toString()
		);

		// Obtain gas used from the receipt
		const tokenSend = web3.utils.toWei("1000", "ether");
		const receipt = await token.transfer(accounts[8], tokenSend, {from: accounts[7]});
		const gasUsed = receipt.receipt.gasUsed;
		console.log('\n\tGas used: ' + new BigNumber(gasUsed).toString());

		// Obtain gasPrice from the transaction
		const tx = await web3.eth.getTransaction(receipt.tx);
		const gasPrice = tx.gasPrice;
		const cost = new BigNumber(gasPrice).mul(gasUsed);
		console.log('\tGas price in WEI: ' + new BigNumber(gasPrice).toString());
		console.log('\tTransaction cost in ETH: ' + new BigNumber(cost).div(10**18).toString());

		// Final balance
		const finalHpaBalance7 = await token.balanceOf(accounts[7]);
		const finalHpaBalance8 = await token.balanceOf(accounts[8]);
		const finalEthBalance7 = await web3.eth.getBalance(accounts[7]);
		const finalEthBalance8 = await web3.eth.getBalance(accounts[8]);
		console.log(
			'\n\tFinal HPA token balance (account 7): ' + new BigNumber(finalHpaBalance7).div(10**18).toString() + ', ' +
			'\tETH balance: ' + new BigNumber(finalEthBalance7).div(10**18).toString()
		);
		console.log(
			'\tFinal HPA token balance (account 8): ' + new BigNumber(finalHpaBalance8).div(10**18).toString() + ', ' +
			'\tETH balance: ' + new BigNumber(finalEthBalance8).div(10**18).toString()
		);

		assert.equal(new BigNumber(initialHpaBalance7).sub(tokenSend).toString(), new BigNumber(finalHpaBalance7).toString() , "HPA balance account 7 not found");
		assert.equal(new BigNumber(initialHpaBalance8).add(tokenSend).toString(), new BigNumber(finalHpaBalance8).toString() , "HPA balance account 8 not found");
		assert.equal(new BigNumber(initialEthBalance7).sub(cost).toString(), new BigNumber(finalEthBalance7).toString() , "ETH balance account 7 not found");
		assert.equal(new BigNumber(initialEthBalance8).toString(), new BigNumber(finalEthBalance8).toString() , "ETH balance account 8 not found");
	});
	it("Test token withdrawal", async () => {
		let sale = await hpa.deployed();
		let tokenAddress = await sale.token();
		let token = await hpaCoin.at(tokenAddress);

		console.log("Test token withdrawal:");
		const initialHpaBalanceOwner = await token.balanceOf(accounts[0]);
		const initialHpaBalanceContract = await token.balanceOf(sale.address);
		console.log(
			'\tInitial HPA token balance (Owner): ' + new BigNumber(initialHpaBalanceOwner).div(10**18).toString()
		);
		console.log(
			'\tInitial HPA token balance (Contract): ' + new BigNumber(initialHpaBalanceContract).div(10**18).toString()
		);
		await sale.withdrawalPlatformTokens(accounts[0], {from: accounts[0]}).then(function (result,error) {
			//console.log('withdrawal error:');
			//console.log(error);
			//console.log('withdrawal result');
			//console.log(result);
		});
		const finalHpaBalanceOwner = await token.balanceOf(accounts[0]);
		const finalHpaBalanceContract = await token.balanceOf(sale.address);
		console.log(
			'\n\tFinal HPA token balance (Owner): ' + new BigNumber(finalHpaBalanceOwner).div(10**18).toString()
		);
		console.log(
			'\tFinal HPA token balance (Contract): ' + new BigNumber(finalHpaBalanceContract).div(10**18).toString()
		);
		assert.equal(new BigNumber(initialHpaBalanceOwner).add(initialHpaBalanceContract).toString(), new BigNumber(finalHpaBalanceOwner).toString() , "HPA balance owner not found");
		assert.equal(new BigNumber(initialHpaBalanceContract).sub(finalHpaBalanceOwner).toString(), new BigNumber(finalHpaBalanceContract).toString() , "HPA balance contract not found");
	});
});