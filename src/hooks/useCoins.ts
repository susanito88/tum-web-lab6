import { useState, useEffect } from "react";
import { localStorageService } from "@/services/storage/localStorageService";

export function useCoins() {
  const [coins, setCoins] = useState(0);

  const refreshCoins = () => {
    setCoins(localStorageService.getCoins());
  };

  useEffect(() => {
    refreshCoins();
  }, []);

  return {
    coins,
    addCoins: (amount: number) => {
      const newAmount = localStorageService.addCoins(amount);
      setCoins(newAmount);
      return newAmount;
    },
    spendCoins: (amount: number) => {
      const success = localStorageService.spendCoins(amount);
      if (success) {
        refreshCoins();
      }
      return success;
    },
    refreshCoins,
  };
}

export function useStreak() {
  const [streak, setStreak] = useState(0);

  const refreshStreak = () => {
    setStreak(localStorageService.getStreak());
  };

  useEffect(() => {
    refreshStreak();
  }, []);

  return {
    streak,
    incrementStreak: () => {
      const newStreak = localStorageService.incrementStreak();
      setStreak(newStreak);
      return newStreak;
    },
    resetStreak: () => {
      localStorageService.resetStreak();
      setStreak(0);
    },
    refreshStreak,
  };
}
