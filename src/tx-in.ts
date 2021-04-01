/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of new TxIn(txHashBuf, txOutNum, script, nSequence) (i.e., you
 * can leave out the scriptVi, which is computed automatically if you leave it
 * out.)
 */
import { Br } from './br'
import { Bw } from './bw'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { Script } from './script'
import { Struct } from './struct'
import { TxOut } from './tx-out'
import { VarInt } from './var-int'

export interface TxInLike {
    txHashBuf: string
    txOutNum: number
    scriptVi: string
    script: string
    nSequence: number
}

export class TxIn extends Struct {
    /* Interpret sequence numbers as relative lock-time constraints. */
    public static readonly LOCKTIME_VERIFY_SEQUENCE = 1 << 0

    /* Setting nSequence to this value for every input in a transaction disables
     * nLockTime. */
    public static readonly SEQUENCE_FINAL = 0xffffffff

    /* Below flags apply in the context of Bip 68 */
    /* If this flag set, txIn.nSequence is NOT interpreted as a relative lock-time.
     * */
    public static readonly SEQUENCE_LOCKTIME_DISABLE_FLAG = 1 << 31

    /* If txIn.nSequence encodes a relative lock-time and this flag is set, the
     * relative lock-time has units of 512 seconds, otherwise it specifies blocks
     * with a granularity of 1. */
    public static readonly SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22

    /* If txIn.nSequence encodes a relative lock-time, this mask is applied to
     * extract that lock-time from the sequence field. */
    public static readonly SEQUENCE_LOCKTIME_MASK = 0x0000ffff

    /* In order to use the same number of bits to encode roughly the same
     * wall-clock duration, and because blocks are naturally limited to occur
     * every 600s on average, the minimum granularity for time-based relative
     * lock-time is fixed at 512 seconds.  Converting from CTxIn::nSequence to
     * seconds is performed by multiplying by 512 = 2^9, or equivalently
     * shifting up by 9 bits. */
    public static readonly SEQUENCE_LOCKTIME_GRANULARITY = 9

    public txHashBuf: Buffer
    public txOutNum: number
    public scriptVi: VarInt
    public script: Script
    public nSequence: number

    constructor(txHashBuf?: Buffer, txOutNum?: number, scriptVi?: VarInt, script?: Script, nSequence = 0xffffffff) {
        super({ txHashBuf, txOutNum, scriptVi, script, nSequence })
    }

    public setScript(script: Script): this {
        this.scriptVi = VarInt.fromNumber(script.toBuffer().length)
        this.script = script
        return this
    }

    public fromProperties(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence: number) {
        this.fromObject({ txHashBuf, txOutNum, nSequence })
        this.setScript(script)
        return this
    }

    public static fromProperties(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence?: number): TxIn {
        return new this().fromProperties(txHashBuf, txOutNum, script, nSequence)
    }

    public fromJSON(json: TxInLike): this {
        this.fromObject({
            txHashBuf: typeof json.txHashBuf !== 'undefined' ? Buffer.from(json.txHashBuf, 'hex') : undefined,
            txOutNum: json.txOutNum,
            scriptVi: typeof json.scriptVi !== 'undefined' ? VarInt.fromJSON(json.scriptVi) : undefined,
            script: typeof json.script !== 'undefined' ? Script.fromJSON(json.script) : undefined,
            nSequence: json.nSequence,
        })
        return this
    }

    public toJSON(): TxInLike {
        return {
            txHashBuf: typeof this.txHashBuf !== 'undefined' ? this.txHashBuf.toString('hex') : undefined,
            txOutNum: this.txOutNum,
            scriptVi: typeof this.scriptVi !== 'undefined' ? this.scriptVi.toJSON() : undefined,
            script: typeof this.script !== 'undefined' ? this.script.toJSON() : undefined,
            nSequence: this.nSequence,
        }
    }

    public fromBr(br: Br): this {
        this.txHashBuf = br.read(32)
        this.txOutNum = br.readUInt32LE()
        this.scriptVi = VarInt.fromBuffer(br.readVarIntBuf())
        this.script = Script.fromBuffer(br.read(this.scriptVi.toNumber()))
        this.nSequence = br.readUInt32LE()
        return this
    }

    public toBw(bw?: Bw): Bw {
        if (!bw) {
            bw = new Bw()
        }
        bw.write(this.txHashBuf)
        bw.writeUInt32LE(this.txOutNum)
        bw.write(this.scriptVi.buf)
        bw.write(this.script.toBuffer())
        bw.writeUInt32LE(this.nSequence)
        return bw
    }

    /**
     * Generate txIn with blank signatures from a txOut and its
     * txHashBuf+txOutNum. A "blank" signature is just an OP_0. The pubKey also
     * defaults to blank but can be substituted with the real public key if you
     * know what it is.
     */
    public fromPubKeyHashTxOut(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, pubKey?: PubKey): this {
        const script = new Script()
        if (txOut.script.isPubKeyHashOut()) {
            script.writeOpCode(OpCode.OP_0) // blank signature
            if (pubKey) {
                script.writeBuffer(pubKey.toBuffer())
            } else {
                script.writeOpCode(OpCode.OP_0)
            }
        } else {
            throw new Error('txOut must be of type pubKeyHash')
        }
        this.txHashBuf = txHashBuf
        this.txOutNum = txOutNum
        this.setScript(script)
        return this
    }

    public hasNullInput(): boolean {
        const hex = this.txHashBuf.toString('hex')
        if (
            hex === '0000000000000000000000000000000000000000000000000000000000000000' &&
            this.txOutNum === 0xffffffff
        ) {
            return true
        }
        return false
    }

    /**
     * Analagous to bitcoind's SetNull in COutPoint
     */
    public setNullInput(): void {
        this.txHashBuf = Buffer.alloc(32)
        this.txHashBuf.fill(0)
        this.txOutNum = 0xffffffff // -1 cast to unsigned int
    }
}
