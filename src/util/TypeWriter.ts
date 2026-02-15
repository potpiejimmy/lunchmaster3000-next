export class TypeWriter {

    currentIndex = 0;
    currentLength = 0;
    currentDir = false;
    started = false;

    constructor(private phrases: string[], private callback: (value: string) => void) {
    }

    start() {
        this.started = true;
        this.next(0);
    };

    stop() {
        this.started = false;
    }

    next(waitTime: number) {
        setTimeout(() => {
            if (!this.started) return;
            if (this.currentDir)
                this.currentLength--;
            else
                this.currentLength++;
            let waitMs = this.currentDir ? 20 : 20 + Math.random() * 70;
            let doContinue = true;
            if (!this.currentDir && this.currentLength === this.phrases[this.currentIndex].length) {
                this.currentDir = true;
                waitMs = 2000;
                if (this.currentIndex === this.phrases.length - 1)
                    doContinue = false;
            }
            else if (this.currentDir && this.currentLength === 0) {
                this.currentDir = false;
                this.currentIndex = (this.currentIndex + 1) % this.phrases.length;
            }
            const isWhole = this.currentLength === this.phrases[this.currentIndex].length;
            this.callback(
                this.phrases[this.currentIndex].substr(0, this.currentLength) + ((isWhole || this.currentLength === 0) ? '' : '\u007C'));
            if (doContinue)
                this.next(waitMs);
			else {
				waitMs = 600000;
				this.next(waitMs);
			}
        }, waitTime);
    }
}
