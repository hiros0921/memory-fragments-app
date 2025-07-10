// ストレージ管理とプラン制限
class StorageManager {
    constructor() {
        this.FREE_LIMIT = 50;
        this.currentPlan = this.getCurrentPlan();
        this.memories = this.loadMemories();
    }

    // 現在のプランを取得
    getCurrentPlan() {
        const plan = localStorage.getItem('userPlan');
        return plan || 'free';
    }

    // プランを設定
    setUserPlan(plan) {
        localStorage.setItem('userPlan', plan);
        this.currentPlan = plan;
        this.notifyPlanChange(plan);
    }

    // メモリーを読み込み
    loadMemories() {
        const data = localStorage.getItem('memories');
        return data ? JSON.parse(data) : [];
    }

    // メモリーを保存
    saveMemory(memory) {
        // 無料プランの場合、容量チェック
        if (this.currentPlan === 'free' && this.memories.length >= this.FREE_LIMIT) {
            return {
                success: false,
                error: 'FREE_LIMIT_EXCEEDED',
                message: `無料プランでは${this.FREE_LIMIT}件までしか保存できません。プレミアムプランにアップグレードしてください。`,
                currentCount: this.memories.length,
                limit: this.FREE_LIMIT
            };
        }

        // メモリーを追加
        memory.id = Date.now().toString();
        memory.createdAt = new Date().toISOString();
        this.memories.push(memory);

        // ローカルストレージに保存
        try {
            localStorage.setItem('memories', JSON.stringify(this.memories));
            
            // プレミアムプランの場合はクラウドにも保存
            if (this.currentPlan === 'premium') {
                this.syncToCloud(memory);
            }

            return {
                success: true,
                memory: memory,
                currentCount: this.memories.length
            };
        } catch (error) {
            return {
                success: false,
                error: 'STORAGE_ERROR',
                message: 'ストレージへの保存に失敗しました。'
            };
        }
    }

    // メモリーを削除
    deleteMemory(id) {
        const index = this.memories.findIndex(m => m.id === id);
        if (index !== -1) {
            this.memories.splice(index, 1);
            localStorage.setItem('memories', JSON.stringify(this.memories));
            
            if (this.currentPlan === 'premium') {
                this.deleteFromCloud(id);
            }
            
            return true;
        }
        return false;
    }

    // 使用状況を取得
    getUsageStats() {
        return {
            currentCount: this.memories.length,
            limit: this.currentPlan === 'free' ? this.FREE_LIMIT : '無制限',
            percentage: this.currentPlan === 'free' 
                ? Math.round((this.memories.length / this.FREE_LIMIT) * 100)
                : 0,
            plan: this.currentPlan,
            canAddMore: this.currentPlan === 'premium' || this.memories.length < this.FREE_LIMIT
        };
    }

    // クラウド同期（スタブ）
    async syncToCloud(memory) {
        // Firebase実装時に追加
        console.log('Cloud sync:', memory);
    }

    async deleteFromCloud(id) {
        // Firebase実装時に追加
        console.log('Cloud delete:', id);
    }

    // プラン変更通知
    notifyPlanChange(plan) {
        window.dispatchEvent(new CustomEvent('planChanged', { 
            detail: { plan, usage: this.getUsageStats() }
        }));
    }

    // ストレージ容量警告
    checkStorageWarning() {
        if (this.currentPlan === 'free') {
            const remaining = this.FREE_LIMIT - this.memories.length;
            if (remaining <= 5 && remaining > 0) {
                return {
                    show: true,
                    message: `あと${remaining}件で無料プランの上限に達します。`,
                    type: 'warning'
                };
            } else if (remaining === 0) {
                return {
                    show: true,
                    message: '無料プランの上限に達しました。プレミアムプランへのアップグレードをご検討ください。',
                    type: 'error'
                };
            }
        }
        return { show: false };
    }
}

// エクスポート
window.StorageManager = StorageManager;