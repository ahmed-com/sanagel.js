const {accessLevels} = require('../../config/magicStrings.json')

const canWrite = accessLevel=>{
    let can;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove_notify:
          can = true;
          break;
        case accessLevels.read_write_invite_remove:
          can = true;
          break;
        case accessLevels.read_write_invite_notify:
          can = true;
          break;
        case accessLevels.read_write_invite:
          can = true;
          break;
        case accessLevels.read_write_notify:
          can = true;
          break;
        case accessLevels.read_write:
          can = true;
          break;
        default:
          can = false;
    }
    return can;
}

const _canInvite = accessLevel=>{
    let can;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove_notify:
          can = true;
          break;
        case accessLevels.read_write_invite_remove:
          can = true;
          break;
        case accessLevels.read_write_invite_notify:
          can = true;
          break;
        case accessLevels.read_write_invite:
          can = true;
          break;
        case accessLevels.read_invite_notify:
          can = true;
          break;
        case accessLevels.read_invite:
          can = true;
          break;
        default:
          can = false;
    }
    return can;
}

const canInvite = (accessLevel,inviteAccessLevel)=>{
    if(!_canInvite(accessLevel)) return false;
    if(!canWrite(accessLevel) && canWrite(inviteAccessLevel)) return false;
    if(!canRemove(accessLevel) && canRemove(inviteAccessLevel)) return false;
    return true;
}

const canRemove = accessLevel=>{
    let can;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove_notify:
          can = true;
          break;
        case accessLevels.read_write_invite_remove:
          can = true;
          break;
        default:
          can = false;
    }
    return can;
}

const addNotify = accessLevel=>{
    let newAccessLevel;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove:
          newAccessLevel = accessLevels.read_write_invite_remove_notify;
          break;
        case accessLevels.read_write_invite:
          newAccessLevel = accessLevels.read_write_invite_notify;
          break;
        case accessLevels.read_write:
          newAccessLevel = accessLevels.read_write_notify;
          break;
        case accessLevels.read_invite:
          newAccessLevel = accessLevels.read_invite_notify;
          break;
        case accessLevels.read_only:
          newAccessLevel = accessLevels.read_notify;
          break;
        default:
          newAccessLevel = accessLevel;
    }
    return newAccessLevel;
}

const stripNotify = accessLevel=>{
    let newAccessLevel;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove_notify:
          newAccessLevel = accessLevels.read_write_invite_remove;
          break;
        case accessLevels.read_write_invite_notify:
          newAccessLevel = accessLevels.read_write_invite;
          break;
        case accessLevels.read_write_notify:
          newAccessLevel = accessLevels.read_write;
          break;
        case accessLevels.read_invite_notify:
          newAccessLevel = accessLevels.read_invite;
          break;
        case accessLevels.read_notify:
          newAccessLevel = accessLevels.read_only;
          break;
        default:
          newAccessLevel = accessLevel;
    }
    return newAccessLevel;
}

const hasNotify = accessLevel=>{
    let has;
    switch(accessLevel) {
        case accessLevels.read_write_invite_remove_notify:
          has = true;
          break;
        case accessLevels.read_write_invite_notify:
          has = true;
          break;
        case accessLevels.read_write_notify:
          has = true;
          break;
        case accessLevels.read_invite_notify:
          has = true;
          break;
        case accessLevels.read_notify:
          has = true;
          break;
        default:
          has = false;
    }
    return has;
}

module.exports = {canWrite, canInvite , canRemove, addNotify, hasNotify , stripNotify};