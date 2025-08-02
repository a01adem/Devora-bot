const { 
  Client, 
  GatewayIntentBits, 
  Partials,
  Events,
  ActivityType,
  EmbedBuilder,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  SelectMenuBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  AttachmentBuilder
} = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const discordTranscripts = require('discord-html-transcripts');
const path = require('path');
const fs = require('fs');


const client = new Client({
   intents: [
     GatewayIntentBits.Guilds,
     GatewayIntentBits.GuildMessages,
     GatewayIntentBits.MessageContent,
     GatewayIntentBits.GuildMembers
   ],
   
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('Devora Studio', { type: ActivityType.Playing });
  
    const channel = await client.channels.fetch('1393644866919207002');
    if (!channel || channel.type !== 2) { // type 2 = صوتي
        return console.error('❌ الروم الصوتي غير موجود أو ليس روم صوتي');
    }

    try {
        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true
        });
      console.log(`The bot has been joined to the voice channel: ${channel.name}`)
    } catch (err) {
        console.error('❌ خطأ في دخول الروم الصوتي:', err);
    }
});

const allowedRoles = ['1393646098580766761', '1393646386125475850']; 
const feedbackChannelId = "1393647000255467570";

const ticketsDataPath = path.join(__dirname, './database/tickets.json');

const auto_line_channels = [
    "1397531810979774514",
    "1393644567563210872"
]
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!auto_line_channels.includes(message.channel.id)) return;

        try {
        await message.channel.send({
            files:["https://i.imgur.com/aXYUVXA.png"]
            });
    } catch (err) {
        console.error('❌ Error sending message:', err);
    }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id === feedbackChannelId) {
    await message.react('<:emoji_17:1397602998729048245>')
    await message.channel.send({
      files: ['https://i.imgur.com/aXYUVXA.png']
    })
  }
if (message.content === 'ticket') {

  const ticketBtn = new ButtonBuilder()
    .setCustomId('create_ticket')
    .setLabel('Open Ticket')
    .setStyle(ButtonStyle.Secondary)     .setEmoji('<:create_ticket:1397305198208352297>');

  const row = new ActionRowBuilder().addComponents(ticketBtn);

  message.channel.send({
    components: [row]
  });
    message.delete();
}

});

client.on('interactionCreate',  async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'create_ticket') {

    const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'))
    const userTickets = ticketsData.filter(ticket => ticket.userId === interaction.user.id && !ticket.closed)
    if (userTickets.length >= 1) {
      return interaction.reply({
        content: '❌ | You have already a opened ticket.',
        ephemeral: true
      })
    }
    const modal = new ModalBuilder()
    .setCustomId('ticket_modal')
    .setTitle('Create a Ticket')

    const reasonInput = new TextInputBuilder()
    .setCustomId('ticket_reason')
    .setLabel('Reason for opening ticket')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(10)

    const row = new ActionRowBuilder()
    .addComponents(reasonInput)

    modal.addComponents(row)
    interaction.showModal(modal)
  }



  

  if (interaction.customId === 'trad_ticket') {
    const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);
    const embed = originalMessage.embeds[0];

    if (!embed) {
      return interaction.reply({ content: '<:no:1397311293941088277> | No embed found to translate.', ephemeral: true });
    }

    // ترجم النصوص
    const translatedEmbed = new EmbedBuilder()
      .setTitle(embed.title?.replace('Ticket', 'تذكرة'))
      .setColor(embed.color ?? 0x2b2d31)
      .setDescription(
        `👋 مرحباً <@${interaction.user.id}>، وشكراً لفتح تذكرة!\n\n` +
        `نعتذر على أي إزعاج. سيتواصل معك فريق الدعم أو الفريق البرمجي قريباً.\n` +
        `يرجى الانتظار بصبر وتجنب منشن الفريق ما لم يكن الأمر ضرورياً. خلال ذلك، يمكنك تزويدنا بأي تفاصيل إضافية قد تساعدنا.`
      )
      .addFields(
        { name: '📄 السبب', value: embed.fields?.[0]?.value || 'لا يوجد سبب', inline: false },
        { name: '🆔 رقم التذكرة', value: embed.fields?.[1]?.value || 'غير متوفر', inline: true },
        { name: '⏰ وقت الفتح', value: embed.fields?.[2]?.value || 'غير متوفر', inline: true },
        { name: '👤 تم الفتح بواسطة', value: embed.fields?.[3]?.value || 'غير معروف', inline: true }
      )
      .setFooter({ text: 'نظام التذاكر' })
      .setTimestamp();

    await interaction.reply({
      embeds: [translatedEmbed],
      ephemeral: true,
    });
  }


    if (interaction.customId === 'claim_ticket') {

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasRole = member.roles.cache.some(role => allowedRoles.includes(role.id));

      if (!hasRole) {
        return interaction.reply({
          content: '<:no:1397311293941088277> | You are not authorized to claim tickets. Only staff members can do this.',
          ephemeral: true
        });
      }

      const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
      const ticket = ticketsData.find(t => t.channelId === interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ content: '<:no:1397311293941088277> | Ticket data not found.', ephemeral: true });
      }

      if (ticket.claimedBy) {
        return interaction.reply({ content: '<:no:1397311293941088277> | This ticket has already been claimed.', ephemeral: true });
      }

      // تحديث بيانات التذكرة
      ticket.claimedBy = interaction.user.id;
      fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null, 2));

      // بناء الأزرار مع تعديل زر Claim معطل واسم "Claimed"
      const closeBtn = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger);

      const claimBtn = new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Claimed')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true);

      const tradBtn = new ButtonBuilder()
        .setCustomId('trad_ticket')
        .setLabel(' ')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:translate:1393675280895311912>');

      const row = new ActionRowBuilder()
        .addComponents(closeBtn, claimBtn, tradBtn);

      // رسالة Embed تعلن الاستلام (ممكن تضيفها في الرسالة الأصلية أو ترسل رسالة جديدة)
      const claimEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`<:Support:1397313882040569866> <@${interaction.user.id}> has claimed this ticket.`)
        .setTimestamp();

      // تحديث الرسالة الأصلية (اللي فيها الأزرار) مع الأزرار الجديدة
      await interaction.update({
        components: [row]
      });

      // إرسال رسالة Embed جديدة في الروم تعلن الاستلام
      await interaction.channel.send({ embeds: [claimEmbed] });

      // رد خاص
      await interaction.followUp({ content: '<:yes:1397311209908207688> | You have claimed this ticket.', ephemeral: true });
    }

    // لما يضغط Close
  if (interaction.customId === 'close_ticket') {
    const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
    const ticket = ticketsData.find(t => t.channelId === interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        content: '<:no:1397311293941088277> | Ticket data not found.',
        ephemeral: true
      });
    }

    if (ticket.closed) {
      return interaction.reply({
        content: '❗ | This ticket is already closed.',
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_close')
        .setLabel('Yes, close it')
        
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('cancel_close')
        .setLabel('No, keep it')
        
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: '<:warning:1397311733172797470> | Are you sure you want to close this ticket?',
      components: [row],
      ephemeral: true
    });
  }

  
    // إذا ضغط "No"
    if (interaction.customId === 'cancel_close') {
      return interaction.update({
        content: '<:no:1397311293941088277> | Ticket closure cancelled.',
        components: [],
      });
    }

    // إذا ضغط "Yes"

  if (interaction.customId === 'confirm_close') {
  const channel = interaction.channel;

  // قراءة بيانات التذاكر
  const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
  const ticketIndex = ticketsData.findIndex(t => t.channelId === channel.id);

  if (ticketIndex === -1) {
    return interaction.reply({ content: '<:no:1397311293941088277> | Ticket data not found.', ephemeral: true });
  }

  // تحديث حالة التذكرة إلى مغلقة
  ticketsData[ticketIndex].closed = true;
  fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null, 2));

  // تحديث صلاحيات القناة → تمنع الكل
  await channel.permissionOverwrites.set([
    {
      id: interaction.guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    }
  ]);

  // نقل القناة إلى الكاتيجوري الخاص بالتذاكر المغلقة
  await channel.setParent('1393686089822113945');

  // إرسال رسالة في القناة تفيد أن التذكرة مغلقة
  const closedEmbed = new EmbedBuilder()
    .setColor(0xED4245)
    .setDescription(`🔒 | This ticket has been closed by <@${interaction.user.id}>.`)
    .setTimestamp();

  const reopenBtn = new ButtonBuilder()
    .setCustomId('reopen_ticket')
    .setLabel('ReOpen')
    .setStyle(ButtonStyle.Primary);

  const deleteBtn = new ButtonBuilder()
    .setCustomId('delete_ticket')
    .setLabel('Delete')
    .setStyle(ButtonStyle.Danger);

  const closeRow = new ActionRowBuilder().addComponents(reopenBtn, deleteBtn);

  await channel.send({ embeds: [closedEmbed], components: [closeRow] });

  // تعديل رسالة التفاعل (زر التأكيد)
  await interaction.update({
    content: '<:yes:1397311209908207688> | Ticket closed.',
    components: [],
  });
}

  if (interaction.customId === 'reopen_ticket') {
  const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
  const ticketIndex = ticketsData.findIndex(t => t.channelId === interaction.channel.id);
  const ticket = ticketsData[ticketIndex];

  if (!ticket) {
    return interaction.reply({ content: '<:no:1397311293941088277> | Ticket data not found.', ephemeral: true });
  }

  // التحقق إذا كانت التذكرة مغلقة
  if (!ticket.closed) {
    return interaction.reply({ content: '❗ | This ticket is not closed.', ephemeral: true });
  }

  // تعديل الحالة إلى مفتوحة
  ticket.closed = false;
  fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null, 2));

  await interaction.channel.setParent(ticket.category);

  const supportRoles = ['1393646386125475850', '1393646098580766761'];

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: ticket.userId,
      allow: [PermissionsBitField.Flags.ViewChannel],
    },
    ...supportRoles.map(roleId => ({
      id: roleId,
      allow: [PermissionsBitField.Flags.ViewChannel],
    }))
  ];

  await interaction.channel.permissionOverwrites.set(overwrites);

  const disabledReopenBtn = new ButtonBuilder()
    .setCustomId('reopen_ticket')
    .setLabel('ReOpen')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const disabledDeleteBtn = new ButtonBuilder()
    .setCustomId('delete_ticket')
    .setLabel('Delete')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(true);

  const controlRow = new ActionRowBuilder().addComponents(disabledReopenBtn, disabledDeleteBtn);

  await interaction.update({
    content: '🔓 | Ticket has been reopened.',
    components: [controlRow],
  });

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`🔓 | This ticket has been reopened by <@${interaction.user.id}>.`)
        .setTimestamp()
    ]
  });
  }

  
  if (interaction.customId === 'delete_ticket') {
  await interaction.reply({
    content: '<:warning:1397311733172797470> | Are you sure you want to permanently delete this ticket?',
    ephemeral: true,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_delete_ticket')
          .setLabel('Yes, delete')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_delete_ticket')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  });
  }
  if (interaction.customId === 'cancel_delete_ticket') {
  await interaction.update({
    content: '<:no:1397311293941088277> | Ticket deletion canceled.',
    components: []
  });
  }
  if (interaction.customId === 'confirm_delete_ticket') {
    const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
    const ticket = ticketsData.find(t => t.channelId === interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        content: '<:no:1397311293941088277> | Ticket data not found.',
        ephemeral: true
      });
    }

    const openedAt = `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`;
    const closedAt = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    // حساب عدد الرسائل والمشاركين
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const messageCount = messages.size;
    const participants = [...new Set(messages.map(msg => msg.author.id))];

    // إرسال رسالة التأكيد
    await interaction.update({
      content: '<:trash:1397312275156570112> | Ticket will be deleted in 5 seconds...',
      components: []
    });
      
      await interaction.channel.send({
      content: `<:trash:1397312275156570112> | <@${interaction.user.id}> Ticket will be deleted in 5 seconds...`,

    });

    // إرسال Embed إلى روم اللوق
    const logChannel = await interaction.guild.channels.fetch('1393692708672897045');
  

    

    const transcriptPath = await discordTranscripts.createTranscript(interaction.channel, {
      poweredBy: false,
      limit: -1,
      footerText: 'Powered by Devora Studio',
      saveImages: true,
      fileName: `transcript-${ticket.channelId}.html`
      
    });

    
    await logChannel.send({
      flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0xFF0000,
      components: [
        {
          type: 10,
          content: `## 🗑️ Ticket Deleted\n\n

- **🆔 Ticket ID:** ${ticket.ticketId}
- **📄 Reason:** ${ticket.reason || 'No reason provided'}
- **👤 Opened By:** <@${ticket.userId}>
- **🗑️ Deleted By:** <@${interaction.user.id}>
- **📅 Opened At:** ${openedAt}
- **📅 Closed At:** ${closedAt}
- **💬 Messages:** ${messageCount}
- **🧑‍🤝‍🧑 Participants:** ${participants.map(id => `<@${id}>`).join(', ') || 'None'}`
        },
        {
          type: 13,
          file: {
            url: `attachment://transcript-${ticket.channelId}.html`
          }
        }
      ]
    }
  ],
  files: [transcriptPath]
});
      await logChannel.send({
          files: ["https://i.imgur.com/aXYUVXA.png"]
       })
    

    // انتظار 5 ثواني ثم حذف القناة
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);

      ticketsData.splice(ticketsData.indexOf(ticket), 1);
      fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null));
      
    }, 5000);
  }


});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'ticket_modal') {
    const reason = interaction.fields.getTextInputValue('ticket_reason');

    const channel = await interaction.guild.channels.create({
      name: `🎟️-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id, 
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: '1393646386125475850',
          allow: [PermissionsBitField.Flags.ViewChannel],
        }
      ],
      parent: '1393659361372405963',
      topic: `Opened by ${interaction.user.tag} | Reason: ${reason}`,
    });

    const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
  
const lastTicketId = ticketsData.length > 0 ? ticketsData[ticketsData.length - 1].ticketId || 0 : 0;
const newTicketId = lastTicketId + 1;
    

    ticketsData.push({
      ticketId: newTicketId,
      channelId: channel.id,
      userId: interaction.user.id,
      reason: reason,
      category: '1393659361372405963',
      createdAt: new Date().toISOString(),
      closed: false,
      claimedBy: null,
    });

    fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null, 2));

    const openedAt = `<t:${Math.floor(Date.now() / 1000)}:F>`; // Discord timestamp format

    

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${newTicketId}`)
      .setColor(0x2b2d31)
      .setDescription(
  `👋 Hello <@${interaction.user.id}>, and thank you for opening a ticket!\n\n` +
  `We're sorry for any inconvenience. Our support or development team will be with you as soon as possible.\n` +
  `Please wait patiently and avoid pinging team members unless necessary. In the meantime, feel free to provide any additional information that may help us assist you better.`
)
      
      .addFields(
        { name: '📄 Reason', value: reason || 'No reason provided' },
        { name: '🆔 Ticket ID', value: `${newTicketId}`, inline: true },
        { name: '⏰ Opened At', value: openedAt, inline: true },
        { name: '👤 Opened By', value: interaction.user.tag, inline: true }
      )
      .setFooter({ text: ' Ticket System' })
      .setTimestamp();

    const closeBtn = new ButtonBuilder()
    .setCustomId('close_ticket')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger)

   const claimBtn = new ButtonBuilder()
    .setCustomId('claim_ticket')
    .setLabel('Claim')
    .setStyle(ButtonStyle.Success)
   
   const tradBtn = new ButtonBuilder()
    .setCustomId('trad_ticket')
    .setLabel(' ')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('<:translate:1393675280895311912>')

    const row = new ActionRowBuilder()
    .addComponents(closeBtn, claimBtn, tradBtn)
    

    await channel.send({
      embeds: [embed],
      content: `${interaction.user} | <@&1393646386125475850>, <@&1393646098580766761>`,
      components: [row]
    });

    await interaction.reply({
      content: `<:yes:1397311209908207688> | Ticket created: ${channel}`,
      ephemeral: true
    });
  }

})


client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('#')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const supportRoles = ['1393646386125475850', '1393646098580766761'];

  // التأكد أن المرسل يملك أحد أدوار الدعم
  const hasSupportRole = message.member.roles.cache.some(role => supportRoles.includes(role.id));
  if (!hasSupportRole) {
    return message.reply('❌ | You do not have permission to use this command.');
  }

  const ticketsData = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf-8'));
  const ticketIndex = ticketsData.findIndex(t => t.channelId === message.channel.id);
  const ticket = ticketsData[ticketIndex];

  if (command === 'close') {
    if (!ticket) return message.reply('❌ | Ticket data not found.');
    if (ticket.closed) return message.reply('❗ | This ticket is already closed.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_close')
        .setLabel('Yes, close it')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_close')
        .setLabel('No, keep it')
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({
      content: '⚠️ | Are you sure you want to close this ticket?',
      components: [row]
    });
  }

  if (command === 'reopen') {
    if (!ticket) return message.reply('❌ | Ticket data not found.');
    if (!ticket.closed) return message.reply('❗ | This ticket is already open.');

    ticket.closed = false;
    fs.writeFileSync(ticketsDataPath, JSON.stringify(ticketsData, null, 2));

    await message.channel.setParent(ticket.category);

    const overwrites = [
      {
        id: message.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: ticket.userId,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
      ...supportRoles.map(roleId => ({
        id: roleId,
        allow: [PermissionsBitField.Flags.ViewChannel],
      }))
    ];

    await message.channel.permissionOverwrites.set(overwrites);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`🔓 | This ticket has been reopened by <@${message.author.id}>.`)
          .setTimestamp()
      ]
    });
  }

  if (command === 'rename') {
    if (!ticket) return message.reply('❌ | This channel is not a ticket.');

    const newName = args.join('-');
    if (!newName) return message.reply('⚠️ | Please provide a new name. Usage: `#rename new-name`');

    try {
      await message.channel.setName(newName);
      message.reply(`✅ | Ticket renamed to \`${newName}\``);
    } catch (error) {
      console.error('Error renaming ticket:', error);
      message.reply('❌ | Failed to rename the ticket. Make sure I have permission.');
    }
  }
  if (command === 'add') {
    if (!ticket) return message.reply('❌ | This channel is not a ticket.');

    const userId = args[0];
    if (!userId || isNaN(userId)) {
      return message.reply('⚠️ | Please provide a valid user ID. Usage: `#add 123456789012345678`');
    }

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return message.reply('❌ | Could not find user in the server.');

      await message.channel.permissionOverwrites.edit(member.user.id, {
        ViewChannel: true,
      });

      message.reply(`✅ | <@${member.user.id}> has been added to the ticket.`);
    } catch (error) {
      console.error('Error adding user to ticket:', error);
      message.reply('❌ | Failed to add user. Make sure I have permission and the ID is correct.');
    }
  }

  if (command === 'remove') {
  if (!ticket) return message.reply('❌ | This channel is not a ticket.');

  const userId = args[0];
  if (!userId || isNaN(userId)) {
    return message.reply('⚠️ | Please provide a valid user ID. Usage: `#remove 123456789012345678`');
  }

  try {
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply('❌ | Could not find user in the server.');

    await message.channel.permissionOverwrites.edit(member.user.id, {
      ViewChannel: false,
    });

    message.reply(`✅ | <@${member.user.id}> has been removed from the ticket.`);
  } catch (error) {
    console.error('Error removing user from ticket:', error);
    message.reply('❌ | Failed to remove user. Make sure I have permission and the ID is correct.');
  }
  }
  
    if (command === 'image') {
        
        const imageUrl = args[0];

        if (!imageUrl || !imageUrl.startsWith('http')) {
            return message.reply('❌ يرجى وضع رابط صورة صالح.');
        }

        try {
            const attachment = new AttachmentBuilder(imageUrl);
            await message.channel.send({ files: [attachment] });
            await message.delete();
        } catch (error) {
            console.error('خطأ عند إرسال الصورة:', error);
            message.reply('❌ حدث خطأ أثناء إرسال الصورة.');
        }
    }
    
    if (command === 'خط') {
        
        message.channel.send({ 
          files: ["https://i.imgur.com/aXYUVXA.png"]
        });
        message.delete();
      }
    
    if (command === 'come') {
 

  const userMention = args[0];
  if (!userMention || !userMention.startsWith('<@') || !userMention.endsWith('>')) {
    return message.reply('⚠️ | Please mention a valid user. Usage: `#come @user`');
  }

  const userId = userMention.replace(/[<@!>]/g, '');

  try {
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply('❌ | Could not find the user in this server.');

    const dmMessage = `مرحبًا <@${userId}> 👋،\nلقد تم استدعاؤك إلى تذكرة بواسطة <@${message.author.id}>.\n📍 القناة: **${message.channel}**`;

      const embed = new EmbedBuilder()
      .setDescription(dmMessage)
      .setImage('https://i.imgur.com/utINHUu.png')
const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Go to Channel')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}`)
      );

      await member.send({
        embeds: [embed],
        components: [row]
      });
    message.reply(`✅ | A DM has been sent to <@${userId}>.`);
  } catch (error) {
    console.error('Error sending DM:', error);
    message.reply('❌ | Could not send a DM to the user. They might have DMs disabled.');
  }
}

});





client.on(Events.MessageCreate, async (message) => {
    if (message.content === '#طرق الدفع') {

        await message.channel.send({
            "flags": 32768,
            "components": [
               
              {
                "type": 17,
                "components": [
                   
                 {
          "type": 12,
          "items": [
            {
              "media": {
                "url": "https://i.imgur.com/avIaxHp.png"
              }
            }
          ]
        },
                 { "type": 14 },
                 {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "paypal",
          "disabled": true,
          "emoji": { 
              "id": "1397560921295028294",
              "name": "paypal1" 
          }
        },
        {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "crypto",
          "disabled": true,
           "emoji": {
            "id": "1397561346517766248", 
            "name": "crypto",
         }
        },
         
        {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "zaincash",
          "disabled": true,
          "emoji": {
          "id": "1397561843458900008",
          "name": "emoji_13",
          }
        },
          
         
         
        {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "razairgold",
          "disabled": true,
          "emoji": {
          "id": "1249331795569278986",
          "name": "razer_gold:",
          }
        },
      ]
    },
                 {
      "type": 1,
      "components": [
              
           {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "stripe",
          "disabled": true,
          "emoji": {
            "id": "1400924320619823135", 
            "name": "stripe" 
             }
        },
        {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "credits",
          "disabled": true,
          "emoji": {
            "id": "1397561202615386165", 
            "name": "credits" 
             }
        },
         {
          "type": 2,
          "style": 2,
          "label": " ",
          "custom_id": "gold",
          "disabled": true,
          "emoji": {
            "id": "1397573686176780360", 
            "name": "gold" 
             }
        },
      
        ]
           }
             
                ]
                    
              },
     {
  "type": 1,
  "components": [
    {
      "type": 2,
      "label": "أطلب الآن",
      "style": 5,
      "url": "https://discord.com/channels/1392791914775969812/1393644665433096414"
    },
      {
          "type": 2,
          "style": 5,
          "url": "https://devora-studio.site",
          "emoji": {
            "id": "1400922211660857477", 
            "name": "IconStatusWebOnline" 
             }
        }
  ]
}

  
            ]
        });
        
    }
});


const { createCanvas, loadImage, registerFont } = require('canvas');

registerFont(path.join(__dirname, 'fonts', 'Almarai-Regular.ttf'), { family: 'Almarai' });
registerFont(path.join(__dirname, 'fonts', 'Poppins-Regular.ttf'), { family: 'Poppins' });


client.on('messageCreate', async (message) => {
  if (message.content === '!card') {
    const width = 774;
    const height = 208;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load background
    const background = await loadImage(path.join(__dirname, 'background.png'));
    ctx.drawImage(background, 0, 0, width, height);

 
    const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 128 });
    const avatarImage = await loadImage(avatarURL);

  // إعدادات الصورة والحدود
const avatarSize = 128;
const borderSize = 6; // سمك الحدود
const avatarX = width - avatarSize - 30;
const avatarY = 30;
const borderRadius = avatarSize / 2 + borderSize / 2;

// رسم حدود دائرية حول الصورة
ctx.beginPath();
ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, borderRadius, 0, Math.PI * 2, true);
ctx.fillStyle = '#22cb86'; // لون الحدود، مثلاً الأخضر
ctx.fill();

// رسم الصورة بشكل دائري داخل الحدود
ctx.save();
ctx.beginPath();
ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
ctx.closePath();
ctx.clip();
ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
ctx.restore();

    // اسم العضو تحت الصورة
    ctx.font = '24px Poppins';
    ctx.fillStyle = '#22cb86';
    ctx.textAlign = 'center';
    ctx.fillText(message.author.username, avatarX + avatarSize / 2, avatarY + avatarSize + 30);

// النص العربي على يمين الأيقونة
ctx.font = '32px Almarai';
ctx.fillStyle = '#22cb86';
ctx.textAlign = 'right';
ctx.textBaseline = 'middle';
const textX = avatarX - 40;
const textY = height / 2;
ctx.fillText('قد اشترى بوت ذكاء اصطناعي بنجاح', textX, textY);
      
    // Send result
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'card.png' });
    message.reply({ files: [attachment] });
  }
});
      


client.login('MTM5MzY0OTE2NTI1NDUyOTE4NQ.GAbHM7.sx0Pi6G_tkYNHvgEvj9RMUgZkXrV57Kt6YttH4');
