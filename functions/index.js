const crypto = require('crypto')
const cryptoJs = require('crypto-js')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')

// Cloud Functionの環境変数
const url = functions.config().url.domain
const gmailEmail = functions.config().gmail.email
const ksatoEmail = functions.config().ksato.email
const mokuboEmail = functions.config().mokubo.email
const encryptKey = functions.config().crypto.key
const sgApiKey = functions.config().sg.key

// Adminの初期化
admin.initializeApp()

// sendGridの初期化
sgMail.setApiKey(sgApiKey)

const encryptPassword = (password) => {
  return cryptoJs.AES.encrypt(password, encryptKey).toString()
}

const decryptPassword = (encrypt) => {
  return cryptoJs.AES.decrypt(encrypt, encryptKey).toString(cryptoJs.enc.Utf8)
}

const generatePassword = () => {
  const n = 10
  return crypto.randomBytes(n).toString('base64').substring(0, n)
}

const sleep = (millisec) => {
  return new Promise((resolve) => setTimeout(resolve, millisec))
}

// ユーザから問い合わせ時に管理者に送るメッセージ
const adminInqueries = (data) => {
  return `お問い合わせがありました。

お名前:
${data.name}

メールアドレス:
${data.email}

件名:
${data.subject}

内容:
${data.message}

頂いたメールアドレスと内容を元に、お問い合わせ内容の回答をお願いいたします。

** 注意事項 **
・このメールは、ユーザから研究室配属希望調査を経由して、自動的に送信されたメッセージになります。
・このメールに返信をしても、ユーザが確認することができません。
・問い合わせがあったユーザに、新規でメールを作成してください。

---------------
同志社大学大学院 理工学研究科 情報工学専攻
同志社大学 理工学部 情報システムデザイン学科
研究室配属希望調査管理チーム
---------------
`
}

// ユーザから問い合わせ時にユーザに送るメッセージ
const userInqueries = (data) => {
  return `${data.name}さん

お問い合わせありがとうございます。
研究室配属希望調査管理チームでございます。

以下、お問い合わせ内容となります。

件名:
${data.subject}

内容:
${data.message}

こちらの内容を元に、管理チームが回答をいたしますので、しばらくお待ち下さい。
お時間を頂き、大変恐縮ですが、よろしくお願いいたします。

** 注意事項 **
・このメールは、研究室配属希望調査を経由して、自動的に送信されたメッセージになります。
・このメールに返信をしても、管理チームが確認することができません。
・管理チームからのメールが来るまで、しばらくお待ちください。

---------------
同志社大学大学院 理工学研究科 情報工学専攻
同志社大学 理工学部 情報システムデザイン学科
研究室配属希望調査管理チーム
---------------
`
}

// ユーザから問い合わせ時にユーザに送るメッセージ
// statusは試行か本番と表記
const userLoginDataMail = (data) => {
  return `${data.name}さん

研究室配属希望調査管理チームでございます。
研究室配属希望調査のログイン情報を記載しておりますので、ご確認をお願い致します。

今回の目的: ${data.status}入力

URL: ${url}
希望調査期間: ${data.beginDate} ~ ${data.endDate}

メールアドレス: ${data.email}
パスワード: ${data.password}

推奨ブラウザはGoogle Chrome（最新版）です。
尚、パスワードに関しては、第三者に漏洩されないように、厳重に保管してください。

何か問題がある場合は、研究室配属希望調査サイト内のお問い合わせフォームからお問い合わせください。

** 注意事項 **
・このメールは、研究室配属希望調査を経由して、自動的に送信されたメッセージになります。
・このメールに返信をしても、管理チームが確認することができません。
・推奨ブラウザ以外（旧バージョン含む）でご利用になられると正常に表示および動作しない恐れがございます。

---------------
同志社大学大学院 理工学研究科 情報工学専攻
同志社大学 理工学部 情報システムデザイン学科
研究室配属希望調査管理チーム
---------------
`
}

// ユーザから問い合わせの実行
exports.sendInqueries = functions.https.onCall(async (data, context) => {
  const admin = {
    from: gmailEmail,
    to: gmailEmail,
    cc: [ksatoEmail, mokuboEmail],
    subject: '研究室配属希望調査のお問い合わせ【' + data.name + 'さん】',
    text: adminInqueries(data),
  }

  const user = {
    from: gmailEmail,
    to: data.email,
    subject: '【研究室配属希望調査】お問い合わせの完了',
    text: userInqueries(data),
  }

  try {
    await sgMail.send(admin)
    await sgMail.send(user)
  } catch (err) {
    // eslint-disable-next-line
    console.log(err)
  }
})

// ユーザにログイン情報を記載したメールを送信する
exports.sendLoginDataBatch = functions.https.onCall(async (data, context) => {
  const year = data.year
  const begin = data.begin
  const end = data.end
  const db = admin.firestore()
  const messages = []

  // ログイン権限があるユーザにのみ送信
  const activeUsersByYear = await db.collection('users').where('year', '==', year).where('isActive', '==', true).get()
  activeUsersByYear.forEach((user) => {
    // eslint-disable-next-line
    const pass = decryptPassword(user.data().password)

    let entry = ''
    if (user.data().status === 'test') {
      entry = '試行'
    } else if (user.data().status === 'prod') {
      entry = '本番'
    }
    const userData = {
      email: user.data().email,
      name: user.data().name,
      status: entry,
      beginDate: begin,
      endDate: end,
      password: pass,
    }

    messages.push({
      to: user.data().email,
      from: mokuboEmail,
      cc: mokuboEmail,
      subject: '【研究室配属希望調査】ログイン情報について',
      text: userLoginDataMail(userData),
    })
  })

  // メール送信の実行
  try {
    await sgMail.send(messages)
  } catch (err) {
    // eslint-disable-next-line
    console.log(err)
  }
})

// 個人ユーザにログイン情報を記載したメールを送信する
exports.sendPersonLoginDataBatch = functions.https.onCall(async (data, context) => {
  const begin = data.begin
  const end = data.end
  const db = admin.firestore()
  const messages = []

  // ログイン権限があるユーザにのみ送信
  for (let i = 0; i < data.ids.length; i++) {
    const activeUserById = await db.collection('users').where('id', '==', data.ids[i]).where('isActive', '==', true).get()
    activeUserById.forEach((user) => {
      const pass = decryptPassword(user.data().password)

      let entry = ''
      if (user.data().status === 'test') {
        entry = '試行'
      } else if (user.data().status === 'prod') {
        entry = '本番'
      }
      const userData = {
        email: user.data().email,
        name: user.data().name,
        status: entry,
        beginDate: begin,
        endDate: end,
        password: pass,
      }

      messages.push({
        to: user.data().email,
        from: mokuboEmail,
        cc: mokuboEmail,
        subject: '【研究室配属希望調査】ログイン情報について',
        text: userLoginDataMail(userData),
      })
    })
  }
  // メール送信の実行
  try {
    await sgMail.send(messages)
  } catch (err) {
    // eslint-disable-next-line
    console.log(err)
  }
})

// Excelから認証情報を追加し、DBにユーザ情報を保存
exports.createUserToAuthAndDB = functions.https.onCall(async (data, context) => {
  const db = admin.firestore()
  const getAuth = admin.auth()
  const res = {
    email: data.email,
    name: data.name,
  }

  // Authのユーザがあれば削除
  await db
    .collection('users')
    .where('id', '==', data.id)
    .get()
    .then(async (snapshot) => {
      if (snapshot !== null) {
        await getAuth
          .getUserByEmail(data.email)
          .then(async (userRecord) => {
            await getAuth.deleteUser(userRecord.uid)
            await db.collection('users').doc(userRecord.uid).delete()
          })
          .catch((error) => {
            res.message = error.message
            res.statusCode = 400
          })
      }
    })

  const pass = generatePassword()
  const authUser = {
    email: data.email,
    password: pass,
    displayName: data.name,
    emailVerified: true,
    disabled: false,
  }

  await getAuth
    .createUser(authUser)
    .then((userRecord) => {
      const usersRef = db.collection('users').doc(userRecord.uid)
      const encrypt = encryptPassword(pass)
      usersRef.set({
        id: data.id,
        name: data.name,
        rank: data.rank,
        group: data.group,
        email: data.email,
        password: encrypt,
        status: data.status,
        isActive: data.isActive,
        isPointAssigned: data.isPointAssigned,
        isGraduate: data.isGraduate,
        point: data.point,
        year: data.year,
      })
      res.statusCode = 200
    })
    .catch((error) => {
      res.message = error.message
      res.statusCode = 400
    })
  return res
})

// ユーザをDBと認証情報から削除
exports.deleteUsersInAuthAndDB = functions.https.onCall(async (data, context) => {
  const db = admin.firestore()
  const getAuth = admin.auth()
  const res = {
    year: data,
  }

  const usersByYear = await db.collection('users').where('year', '==', data).get()
  usersByYear.forEach(async (user) => {
    try {
      await getAuth.deleteUser(user.id)
      await db.collection('users').doc(user.id).delete()
    } catch (err) {
      // eslint-disable-next-line
      console.error(err)
    }
    // 暫定対応
    // データ数が100件ほどになると、処理が落ちることがあるため、sleepさせる
    await sleep(1000)
  })
  return res
})

// 本番用データの登録
exports.registerProdData = functions.https.onCall(async (data, context) => {
  const db = admin.firestore()
  const getAuth = admin.auth()
  const res = { email: data.email, name: data.name }
  let isExistTestUser = false

  await db
    .collection('users')
    .where('status', '==', 'test')
    .where('year', '==', data.year)
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        // 3項目中2つ以上一致で同一人物とみなす
        let sameItem = 0
        if (doc.data().id === data.id) sameItem++
        if (doc.data().email === data.email) sameItem++
        if (doc.data().name === data.name) sameItem++
        // 本番用データにあって、テスト用データにある場合
        if (sameItem >= 2) {
          const pass = generatePassword()
          const encrypt = encryptPassword(pass)
          doc.ref.update({
            rank: data.rank,
            group: data.group,
            password: encrypt,
            status: data.status,
          })
          try {
            await getAuth.updateUser(doc.id, { password: encrypt })
          } catch (err) {
            console.error(err)
          }
          res.statusCode = 200
          isExistTestUser = true
        }
      })
    })
  // 本番用データにあって、テスト用データにない場合
  if (!isExistTestUser) {
    // Authのユーザがあれば削除
    await db
      .collection('users')
      .where('id', '==', data.id)
      .get()
      .then(async (snapshot) => {
        if (snapshot !== null) {
          await getAuth
            .getUserByEmail(data.email)
            .then(async (userRecord) => {
              await getAuth.deleteUser(userRecord.uid)
              await db.collection('users').doc(userRecord.uid).delete()
            })
            .catch((error) => {
              res.message = error.message
              res.statusCode = 400
            })
        }
      })
    const pass = generatePassword()
    const authUser = {
      email: data.email,
      password: pass,
      displayName: data.name,
      emailVerified: true,
      disabled: false,
    }
    await getAuth
      .createUser(authUser)
      .then((userRecord) => {
        const usersRef = db.collection('users').doc(userRecord.uid)
        const encrypt = encryptPassword(pass)
        usersRef.set({
          id: data.id,
          name: data.name,
          rank: data.rank,
          group: data.group,
          email: data.email,
          password: encrypt,
          status: data.status,
          isActive: data.isActive,
          isPointAssigned: data.isPointAssigned,
          isGraduate: data.isGraduate,
          point: data.point,
          year: data.year,
        })
        res.statusCode = 200
      })
      .catch((error) => {
        res.message = error.message
        res.statusCode = 400
      })
  }
  return res
})

// 論理削除されているユーザかどうかを判別
exports.isDeletedUser = functions.https.onCall(async (data, context) => {
  const db = admin.firestore()
  let isDeletedUser = false

  await db
    .collection('users')
    .where('status', '==', 'test')
    .where('year', '==', data.year)
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        // 3項目中2つ以上一致で同一人物とみなす
        let sameItem = 0
        if (doc.data().id === data.id) sameItem++
        if (doc.data().email === data.email) sameItem++
        if (doc.data().name === data.name) sameItem++
        // テスト用データがある場合
        if (sameItem >= 2) {
          // 論理削除されていた場合
          if (doc.data().isActive === false) {
            isDeletedUser = true
          } else {
            isDeletedUser = false
          }
        }
      })
    })
  return isDeletedUser
})

// 論理削除されているユーザを元に戻す
exports.restoreUser = functions.https.onCall(async (data, context) => {
  const db = admin.firestore()
  const getAuth = admin.auth()

  await db
    .collection('users')
    .where('status', '==', 'test')
    .where('year', '==', data.year)
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        // 3項目中2つ以上一致で同一人物とみなす
        let sameItem = 0
        if (doc.data().id === data.id) sameItem++
        if (doc.data().email === data.email) sameItem++
        if (doc.data().name === data.name) sameItem++
        if (sameItem >= 2) {
          doc.ref.update({ status: data.status, isActive: true })
          try {
            await getAuth.updateUser(doc.id, { disabled: false })
          } catch (err) {
            // eslint-disable-next-line
            console.error(err)
          }
        }
      })
    })
})

// テスト用データにあって本番用データにないユーザを論理削除
exports.deleteTestData = functions.https.onCall(async (students, context) => {
  const db = admin.firestore()
  const getAuth = admin.auth()

  await db
    .collection('users')
    .where('status', '==', 'test')
    .where('year', '==', students[0].year)
    .get()
    .then((snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        let isExistProdData = false
        students.forEach((student) => {
          // 3項目中2つ以上一致で同一人物とみなす
          let sameItem = 0
          if (doc.data().id === student.id) sameItem++
          if (doc.data().email === student.email) sameItem++
          if (doc.data().name === student.name) sameItem++
          if (sameItem >= 2) {
            isExistProdData = true
          }
        })
        if (!isExistProdData) {
          doc.ref.update({ isActive: false })
          try {
            await getAuth.updateUser(doc.id, { disabled: true })
          } catch (err) {
            // eslint-disable-next-line
            console.error(err)
          }
        }
      })
    })
})
