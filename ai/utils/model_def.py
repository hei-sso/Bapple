import tensorflow as tf

EMBED_DIM = 64

class TwoTower(tf.keras.Model):
    def __init__(self, user_vocab, recipe_vocab, dim=64):
        super().__init__()

        user_vocab   = [str(u) for u in user_vocab]
        recipe_vocab = [str(r) for r in recipe_vocab]
        dim = int(dim)

        #User tower
        self.user_lookup = tf.keras.layers.StringLookup(
            vocabulary=user_vocab,
            mask_token=None
        )
        self.user_emb = tf.keras.layers.Embedding(
            input_dim=len(user_vocab) + 1,
            output_dim=dim
        )

        #Recipe tower
        self.recipe_lookup = tf.keras.layers.StringLookup(
            vocabulary=recipe_vocab,
            mask_token=None
        )
        self.recipe_emb = tf.keras.layers.Embedding(
            input_dim=len(recipe_vocab) + 1,
            output_dim=dim
        )

        self.loss_tracker = tf.keras.metrics.Mean(name="loss")

    @property
    def metrics(self):
        return [self.loss_tracker]
    
    # 학습용 메서드(서버에서는 주로 안 씀, 하지만 로딩에는 문제 없음)
    def train_step(self, data):
        user_ids   = data["user_id"]
        recipe_ids = data["recipe_id"]

        with tf.GradientTape() as tape:
            u_vec = self.user_emb(self.user_lookup(user_ids))
            r_vec = self.recipe_emb(self.recipe_lookup(recipe_ids))

            u_vec = tf.math.l2_normalize(u_vec, axis=1)
            r_vec = tf.math.l2_normalize(r_vec, axis=1)

            logits = tf.matmul(u_vec, r_vec, transpose_b=True)
            labels = tf.range(tf.shape(logits)[0])

            loss = tf.nn.sparse_softmax_cross_entropy_with_logits(
                labels=labels,
                logits=logits
            )
            loss = tf.reduce_mean(loss)

        grads = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}

    def test_step(self, data):
        user_ids   = data["user_id"]
        recipe_ids = data["recipe_id"]

        u_vec = self.user_emb(self.user_lookup(user_ids))
        r_vec = self.recipe_emb(self.recipe_lookup(recipe_ids))

        u_vec = tf.math.l2_normalize(u_vec, axis=1)
        r_vec = tf.math.l2_normalize(r_vec, axis=1)

        logits = tf.matmul(u_vec, r_vec, transpose_b=True)
        labels = tf.range(tf.shape(logits)[0])

        loss = tf.nn.sparse_softmax_cross_entropy_with_logits(
            labels=labels,
            logits=logits
        )
        loss = tf.reduce_mean(loss)

        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}