const { createApp, reactive, ref, computed } = Vue;

createApp({
  setup() {
    const gameStarted = ref(false);
    const setupCount = ref(3);
    const playerInputs = reactive([]);
    const players = reactive([]);
    const iterations = reactive([]);
    const roundNumber = ref(1);
    const selectedWinner = ref("");
    const history = reactive([]);
    const undoSnapshot = ref(null);

    const currentPot = computed(() => {
      let pot = 0;
      for (let r = 0; r < iterations.length; r++) {
        for (let p = 0; p < players.length; p++) {
          const v = parseFloat(iterations[r][p]) || 0;
          pot += v;
        }
      }
      return pot;
    });

    function createPlayerInputs() {
      playerInputs.splice(0);
      for (let i = 0; i < setupCount.value; i++) {
        playerInputs.push({ name: `Player ${i + 1}`, wallet: 1000 });
      }
    }

    function startGame() {
      if (!playerInputs.length) {
        alert("Create players first.");
        return;
      }
      players.splice(0);
      playerInputs.forEach(p => {
        players.push({
          name: p.name.trim() || "Player",
          wallet: parseFloat(p.wallet) || 0,
          reserved: 0
        });
      });
      iterations.splice(0);
      iterations.push(new Array(players.length).fill(""));
      roundNumber.value = 1;
      history.splice(0);
      selectedWinner.value = "";
      undoSnapshot.value = null;
      gameStarted.value = true;
    }

    function resetGame() {
      if (!confirm("Reset the whole game?")) return;
      playerInputs.splice(0);
      players.splice(0);
      iterations.splice(0);
      history.splice(0);
      selectedWinner.value = "";
      gameStarted.value = false;
    }

    function placeholderForPlayer() {
      return "0.00";
    }

    function available(p) {
      let reserved = 0;
      for (let r = 0; r < iterations.length; r++) {
        const v = parseFloat(iterations[r][players.indexOf(p)]) || 0;
        reserved += v;
      }
      return Math.max(0, p.wallet - reserved);
    }

    function onBetInput(rIndex, pIndex) {
      let raw = iterations[rIndex][pIndex];
      if (raw === null || raw === undefined) raw = "";
      if (raw !== "" && Number(raw) < 0) {
        iterations[rIndex][pIndex] = "";
        return;
      }

      for (let pi = 0; pi < players.length; pi++) {
        let reserved = 0;
        for (let rr = 0; rr < iterations.length; rr++) {
          reserved += parseFloat(iterations[rr][pi]) || 0;
        }
        if (reserved - 1e-9 > players[pi].wallet) {
          iterations[rIndex][pIndex] = "";
          alert(`${players[pi].name} would exceed wallet limit. Reduce bet.`);
          return;
        }
      }

      const lastRow = iterations[iterations.length - 1];
      const anyVal = lastRow.some(
        v => v !== null && v !== undefined && v.toString().trim() !== ""
      );
      if (anyVal && iterations.length < 200) {
        iterations.push(new Array(players.length).fill(""));
      }
    }

    function computeReserved() {
      const reserved = players.map(_ => 0);
      for (let r = 0; r < iterations.length; r++) {
        for (let p = 0; p < players.length; p++) {
          reserved[p] += parseFloat(iterations[r][p]) || 0;
        }
      }
      return reserved;
    }

    function settleRound() {
      if (!selectedWinner.value) {
        alert("Select a winner first.");
        return;
      }

      const reserved = computeReserved();
      for (let i = 0; i < players.length; i++) {
        if (reserved[i] - 1e-9 > players[i].wallet) {
          alert(
            `${players[i].name} reserved ${reserved[i]} which exceeds wallet ${players[i].wallet}. Fix bets.`
          );
          return;
        }
      }

      const pot = reserved.reduce((s, v) => s + v, 0);
      if (pot <= 0) {
        if (!confirm("No bets placed. Do you still want to settle (no-op)?")) return;
      }

      undoSnapshot.value = {
        players: JSON.parse(JSON.stringify(players)),
        history: JSON.parse(JSON.stringify(history)),
        roundNumber: roundNumber.value
      };

      players.forEach((p, i) => (p.wallet = +(p.wallet - reserved[i])));
      const winner = players.find(p => p.name === selectedWinner.value);
      if (!winner) {
        alert("Winner not found.");
        return;
      }
      winner.wallet = +(winner.wallet + pot);

      const committed = {};
      players.forEach((p, i) => (committed[p.name] = reserved[i]));

      history.unshift({
        round: roundNumber.value,
        pot: pot,
        winner: winner.name,
        committed
      });

      iterations.splice(0);
      iterations.push(new Array(players.length).fill(""));
      selectedWinner.value = "";
      roundNumber.value++;
    }

    function undoLastRound() {
      if (!undoSnapshot.value) {
        alert("Nothing to undo.");
        return;
      }
      const snap = undoSnapshot.value;
      players.splice(0);
      snap.players.forEach(p => players.push(p));
      history.splice(0);
      snap.history.forEach(h => history.push(h));
      roundNumber.value = snap.roundNumber;
      iterations.splice(0);
      iterations.push(new Array(players.length).fill(""));
      undoSnapshot.value = null;
    }

    function summaryCommitted(committed) {
      return Object.entries(committed)
        .map(([k, v]) => `${k}: ₹${v.toFixed(2)}`)
        .join(", ");
    }

    return {
      gameStarted,
      setupCount,
      playerInputs,
      createPlayerInputs,
      startGame,
      resetGame,
      players,
      iterations,
      onBetInput,
      inputClass: () => "",
      placeholderForPlayer,
      available,
      currentPot,
      selectedWinner,
      settleRound,
      history,
      roundNumber,
      undoLastRound,
      undoSnapshot,
      summaryCommitted
    };
  }
}).mount("#app");
