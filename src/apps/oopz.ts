import { OopzBot, OopzConfig } from "oopz-sdk"
import { config } from "../utils/index.js"
import { logger } from "node-karin"
const loggerPluginName = logger.chalk.hex("#90CAF9")(" ===== oopz-link ===== ")

class oopz {
  oopzBot: OopzBot | undefined
  //缓存用户昵称、频道名、区域名
  areaCache: Map<string, string> = new Map() //key areaId value areaName
  channelCache: Map<string, string> = new Map() //key channelId value channelName
  userCache: Map<string, string> = new Map() //key userId value userName

  constructor() {
    const canInit = this.checkConfig()
    if (canInit) {
      this.oopzBot = new OopzBot(
        new OopzConfig({
          deviceId: config().deviceId,
          personUid: config().personUid,
          jwtToken: config().jwtToken,
          privateKey: config().privateKey,
          ignoreSelfMessages: true,
          autoSubscribeJoinedAreas: true,
          // debug: true,
        }),
      )
      this.eventListener()
    }
  }
  /**
   * 检查配置文件是否包含必要的参数
   * @returns {boolean} 如果所有必要参数都存在则返回true，否则返回false
   */
  checkConfig() {
    const _config = config() // 获取配置对象
    const oopzNeed = ["deviceId", "personUid", "jwtToken", "privateKey"] // 定义必要的参数数组
    let hasKey = true // 初始化标志位，假设所有必要参数都存在
    // 遍历配置对象的所有键
    Object.keys(_config).forEach((key) => {
      // 检查当前键是否在必要参数数组中
      if (oopzNeed.includes(key)) {
        // 如果必要参数的值为空或未定义
        if (!_config[key]) {
          // 记录错误日志，指出缺少哪个参数
          logger.error(loggerPluginName, `oopz配置文件缺少必要的参数: ${key}`)
          hasKey = false // 更新标志位为false
        }
      }
    })
    // 如果标志位为false，说明有必要的参数缺失
    if (!hasKey) {
      // 记录错误日志，提示用户查看文档
      logger.error(loggerPluginName, "请查询readme文档查询如何获取参数。")
    }
    // 返回标志位，表示配置是否完整
    return hasKey
  }
  async eventListener() {
    if (this.oopzBot) {
      this.oopzBot.on("voice.enter", (event) => {
        logger.info(loggerPluginName, "voice.enter", event)
      })
      this.oopzBot.on("voice.leave", (event) => {
        logger.info(loggerPluginName, "voice.leave", event)
      })
    } else {
      logger.error(loggerPluginName, "oopzBot还未初始化，请重试")
    }
  }
  async start() {
    return new Promise<void>((resolve, reject) => {
      if (this.oopzBot) {
        this.oopzBot
          .start()
          .then(() => {
            logger.info(loggerPluginName, "oopzBot已启动")
            resolve()
          })
          .catch((error) => {
            logger.error(loggerPluginName, "oopzBot启动失败", error)
            reject(error)
          })
      } else {
        logger.error(loggerPluginName, "oopzBot还未初始化，请重试")
        reject(new Error("oopzBot未初始化"))
      }
    })
  }
  async getAreas() {
    if (this.oopzBot) {
      const areas = await this.oopzBot.areas.getJoinedAreas()
      // logger.info(loggerPluginName, "获取已加入的区域列表:", areas)
      for (let i = 0; i < areas.length; i++) {
        const area = areas[i]
        logger.info(
          loggerPluginName,
          "区域ID:",
          area.areaId,
          "区域名称:",
          area.name,
        )

        const channelGroups = await this.getChannels(area.areaId)
        if (channelGroups && channelGroups.length > 0) {
          for (let j = 0; j < channelGroups.length; j++) {
            const channelGroup = channelGroups[j]
            logger.info(
              loggerPluginName,
              "频道组ID:",
              channelGroup.groupId,
              "频道组名称:",
              channelGroup.name,
            )
            if (channelGroup.channels && channelGroup.channels.length > 0) {
              for (let k = 0; k < channelGroup.channels.length; k++) {
                const channel = channelGroup.channels[k]
                logger.info(
                  loggerPluginName,
                  "频道ID:",
                  channel.channelId,
                  "频道名称:",
                  channel.name,
                )
                const memberList =
                  await this.oopzBot.channels.getVoiceChannelMembers(
                    channel.channelId,
                  )
              }
            }
          }
        }
      }
      return areas
    } else {
      logger.error(loggerPluginName, "oopzBot还未初始化，请重试")
    }
  }
  async getChannels(areaId: string) {
    if (this.oopzBot) {
      const channels = await this.oopzBot.areas.getAreaChannels(areaId)
      return channels
    } else {
      logger.error(loggerPluginName, "oopzBot还未初始化，请重试")
    }
  }
}
const bot = new oopz()
await bot.oopzBot?.start()
// bot.getAreas()
// setTimeout(() => {
// bot.oopzBot?.channels
//   .getVoiceChannelMembers("01KVD9WP4K2DXGGGN4MDBC6N7R")
//   .then((channel) => {
//     logger.info(loggerPluginName, "获取频道成员列表:", channel.channelMembers)
//   })
// },1000)