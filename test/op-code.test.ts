import should = require('should')
import { OpCode } from '../src/op-code'

describe('OpCode', () => {
    it('should create a new OpCode', () => {
        const opCode = new OpCode(5)
        should.exist(opCode)
    })

    it('should have 124 opCodes', () => {
        let i = 0
        for (const key in OpCode) {
            if (key.indexOf('OP_') !== -1) {
                i++
            }
        }
        i.should.equal(124)
    })

    it('should convert to a string with this handy syntax', () => {
        new OpCode(0).toString().should.equal('OP_0')
        new OpCode(96).toString().should.equal('OP_16')
        new OpCode(97).toString().should.equal('OP_NOP')
    })

    it('should convert to a number with this handy syntax', () => {
        new OpCode().fromString('OP_0').toNumber().should.equal(0)
        new OpCode().fromString('OP_16').toNumber().should.equal(96)
        new OpCode().fromString('OP_NOP').toNumber().should.equal(97)
    })

    describe('#fromNumber', () => {
        it('should work for 0', () => {
            new OpCode().fromNumber(0).num.should.equal(0)
        })
    })

    describe('#toNumber', () => {
        it('should work for 0', () => {
            new OpCode().fromNumber(0).toNumber().should.equal(0)
        })
    })

    describe('#fromString', () => {
        it('should work for OP_0', () => {
            new OpCode().fromString('OP_0').num.should.equal(0)
        })
    })

    describe('#toString', () => {
        it('should work for OP_0', () => {
            new OpCode().fromString('OP_0').toString().should.equal('OP_0')
        })
    })

    describe('@str', () => {
        it('should exist and have op 185', () => {
            should.exist(OpCode.str)
            OpCode.str[185].should.equal('OP_NOP10')
        })
    })
})
