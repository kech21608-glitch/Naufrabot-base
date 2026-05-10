let prefix = '.';

module.exports = {
    botName: '𝐓𝐑𝐀𝐔𝐌𝐀 𝐔𝐋𝐓𝐑𝐀',
    version: '2.5.0',
    owner: '',

    defaultPrefix: '.',
    get prefix() {
        return prefix;
    },
    set prefix(newPrefix) {
        prefix = newPrefix;
    },

    allowedGroups: [],

    messages: {
        error: '❌ حدث خطأ أثناء تنفيذ الأمر',
        noPermission: '🚫 ليس لديك صلاحية لاستخدام هذا الأمر',
        groupOnly: '❗ هذا الأمر متاح فقط في المجموعات',
        ownerOnly: '⚡ هذا الأمر متاح فقط للنخبة',
        notAllowedGroup: '🚫 عذراً، البوت لا يعمل في هذه المجموعة'
    },

    colors: {
        success: '\x1b[32m',
        error: '\x1b[31m',
        info: '\x1b[36m',
        warn: '\x1b[33m',
        reset: '\x1b[0m'
    }
};
